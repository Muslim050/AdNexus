'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { advertisers, contracts, type ContractStatus } from '@/db/schema'
import { requireRole } from '@/lib/auth'
import { dropFile } from '@/lib/blob'
import { parseAttachedFile } from '@/lib/files'
import {
  dateField,
  isUniqueViolation,
  percentField,
  text,
  type FormState,
} from '@/lib/forms'
import { EDITORS } from '@/lib/roles'

const STATUSES: ContractStatus[] = ['active', 'completed', 'terminated']

/** Поля договора из формы — общие для создания и правки. */
function readContract(fd: FormData) {
  const values = {
    advertiserId: text(fd, 'advertiserId', 36),
    number: text(fd, 'number', 100),
    campaignName: text(fd, 'campaignName', 300),
    startDate: dateField(fd, 'startDate'),
    endDate: dateField(fd, 'endDate'),
    paymentDate: dateField(fd, 'paymentDate'),
    status: text(fd, 'status', 20) as ContractStatus,
    discount: percentField(fd, 'discount'),
    file: parseAttachedFile(fd.get('file'), 'contracts'),
  }
  const { startDate, endDate, paymentDate, discount } = values

  const errors: Record<string, string> = {}
  if (!values.advertiserId) errors.advertiserId = 'Выберите рекламодателя'
  if (!values.number) errors.number = 'Укажите номер договора'
  if (startDate === false) errors.startDate = 'Неверная дата'
  if (endDate === false) errors.endDate = 'Неверная дата'
  if (paymentDate === false) errors.paymentDate = 'Неверная дата'
  if (startDate && endDate && endDate < startDate) {
    errors.endDate = 'Окончание раньше начала'
  }
  if (!STATUSES.includes(values.status)) errors.status = 'Выберите статус'
  if (discount === false) errors.discount = 'Скидка — число от 0 до 100'
  if (
    Object.keys(errors).length ||
    discount === false ||
    startDate === false ||
    endDate === false ||
    paymentDate === false
  ) {
    return { ok: false as const, errors }
  }
  return {
    ok: true as const,
    values: {
      ...values,
      startDate: startDate || null,
      endDate: endDate || null,
      paymentDate: paymentDate || null,
      discount: discount.toFixed(2),
    },
  }
}

// Номер уникален по всей базе — иначе он всплывёт у двух брендов.
const NUMBER_TAKEN = { errors: { number: 'Договор с таким номером уже есть' } }

function refresh() {
  revalidatePath('/advertisers/contracts')
  revalidatePath('/advertisers')
  revalidatePath('/calendar')
  revalidatePath('/orders')
  revalidatePath('/facts')
}

export async function createContract(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireRole(EDITORS)
  const read = readContract(fd)
  if (!read.ok) return { errors: read.errors }
  const { values } = read

  const db = getDb()
  const [advertiser] = await db
    .select({ name: advertisers.name, legalName: advertisers.legalName })
    .from(advertisers)
    .where(eq(advertisers.id, values.advertiserId))
    .limit(1)
  if (!advertiser) {
    return { errors: { advertiserId: 'Рекламодатель не найден' } }
  }

  try {
    // Юр. лицо — из карточки бренда, в форме договора не спрашиваем.
    await db
      .insert(contracts)
      .values({ ...values, legalName: advertiser.legalName })
  } catch (err) {
    if (isUniqueViolation(err)) return NUMBER_TAKEN
    throw err
  }

  refresh()
  return {
    ok: true,
    message: `Договор ${values.number} добавлен бренду ${advertiser.name}`,
  }
}

/**
 * Правка договора. Бренд не меняется: к договору привязаны брони. Суммы
 * прежних броней остаются как были — новая скидка войдёт в новые брони.
 */
export async function updateContract(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireRole(EDITORS)
  const id = text(fd, 'id', 36)
  const read = readContract(fd)
  if (!read.ok) return { errors: read.errors }
  const { advertiserId, ...values } = read.values

  const db = getDb()
  const [existing] = await db
    .select({ advertiserId: contracts.advertiserId, file: contracts.file })
    .from(contracts)
    .where(eq(contracts.id, id))
    .limit(1)
  if (!existing) return { error: 'Договор не найден — возможно, его удалили' }
  if (existing.advertiserId !== advertiserId) {
    return { errors: { advertiserId: 'Бренд договора не меняется' } }
  }

  try {
    await db.update(contracts).set(values).where(eq(contracts.id, id))
  } catch (err) {
    if (isUniqueViolation(err)) return NUMBER_TAKEN
    throw err
  }
  if (existing.file && existing.file.pathname !== values.file?.pathname) {
    await dropFile(existing.file)
  }

  refresh()
  return { ok: true, message: `Договор ${values.number} сохранён` }
}
