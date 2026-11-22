'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { advertisers, contracts, type ContractStatus } from '@/db/schema'
import { requireRole } from '@/lib/auth'
import { parseAttachedFile } from '@/lib/files'
import {
  dateField,
  isUniqueViolation,
  percentField,
  text,
  type FormState,
} from '@/lib/forms'

const STATUSES: ContractStatus[] = ['active', 'completed', 'terminated']

export async function createContract(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireRole(['admin'])

  const advertiserId = text(fd, 'advertiserId', 36)
  const number = text(fd, 'number', 100)
  const campaignName = text(fd, 'campaignName', 300)
  const startDate = dateField(fd, 'startDate')
  const endDate = dateField(fd, 'endDate')
  const paymentDate = dateField(fd, 'paymentDate')
  const status = text(fd, 'status', 20) as ContractStatus
  const discount = percentField(fd, 'discount')
  const file = parseAttachedFile(fd.get('file'), 'contracts')

  const errors: Record<string, string> = {}
  if (!advertiserId) errors.advertiserId = 'Выберите рекламодателя'
  if (!number) errors.number = 'Укажите номер договора'
  if (startDate === false) errors.startDate = 'Неверная дата'
  if (endDate === false) errors.endDate = 'Неверная дата'
  if (paymentDate === false) errors.paymentDate = 'Неверная дата'
  if (startDate && endDate && endDate < startDate) {
    errors.endDate = 'Окончание раньше начала'
  }
  if (!STATUSES.includes(status)) errors.status = 'Выберите статус'
  if (discount === false) errors.discount = 'Скидка — число от 0 до 100'
  if (Object.keys(errors).length || discount === false) return { errors }

  const db = getDb()
  const [advertiser] = await db
    .select({ name: advertisers.name, legalName: advertisers.legalName })
    .from(advertisers)
    .where(eq(advertisers.id, advertiserId))
    .limit(1)
  if (!advertiser) {
    return {
      errors: { advertiserId: 'Рекламодатель не найден' },
    }
  }

  try {
    await db.insert(contracts).values({
      advertiserId,
      number,
      campaignName,
      // Юр. лицо — из карточки бренда, в форме договора не спрашиваем.
      legalName: advertiser.legalName,
      startDate: startDate || null,
      endDate: endDate || null,
      paymentDate: paymentDate || null,
      status,
      discount: discount.toFixed(2),
      file,
    })
  } catch (err) {
    // Номер уникален по всей базе — иначе он всплывёт у двух брендов.
    if (isUniqueViolation(err)) {
      return {
        errors: { number: 'Договор с таким номером уже есть' },
      }
    }
    throw err
  }

  revalidatePath('/advertisers/contracts')
  revalidatePath('/advertisers')
  return {
    ok: true,
    message: `Договор ${number} добавлен бренду ${advertiser.name}`,
  }
}
