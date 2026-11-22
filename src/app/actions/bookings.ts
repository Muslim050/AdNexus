'use server'

import { revalidatePath } from 'next/cache'
import { and, eq, inArray } from 'drizzle-orm'
import { del } from '@vercel/blob'
import { getDb } from '@/db'
import { bookings, contracts, placementFormats, users } from '@/db/schema'
import { requireRole } from '@/lib/auth'
import { formatDay } from '@/lib/dates'
import { parseAttachedFile, type AttachedFile } from '@/lib/files'
import { dateField, isUniqueViolation, text, type FormState } from '@/lib/forms'

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

interface BookingValues {
  date: string
  time: string
  managerId: string
  formatId: string
  advertiserId: string
  contractId: string
  campaignName: string
  comment: string
  file: AttachedFile | null
}

/**
 * Поля брони из формы и проверка связей: формат активен (или это формат
 * самой брони при правке), менеджер — сотрудник, договор — у этого бренда.
 */
async function readBooking(
  fd: FormData,
  currentFormatId?: string,
): Promise<
  | { ok: true; values: BookingValues; formatName: string }
  | { ok: false; state: FormState }
> {
  const date = dateField(fd, 'date')
  const values = {
    time: text(fd, 'time', 5),
    managerId: text(fd, 'managerId', 36),
    formatId: text(fd, 'formatId', 36),
    advertiserId: text(fd, 'advertiserId', 36),
    contractId: text(fd, 'contractId', 36),
    campaignName: text(fd, 'campaignName', 300),
    comment: text(fd, 'comment', 1000),
    file: parseAttachedFile(fd.get('file'), 'bookings'),
  }

  const errors: Record<string, string> = {}
  if (!date) errors.date = 'Укажите дату'
  if (!TIME.test(values.time)) errors.time = 'Укажите время'
  if (!values.managerId) errors.managerId = 'Выберите менеджера'
  if (!values.formatId) errors.formatId = 'Выберите формат'
  if (!values.advertiserId) errors.advertiserId = 'Выберите рекламодателя'
  if (!values.contractId) errors.contractId = 'Выберите договор'
  if (!values.campaignName) errors.campaignName = 'Укажите рекламную кампанию'
  if (Object.keys(errors).length || !date) {
    return { ok: false, state: { errors } }
  }

  const db = getDb()
  const [[format], [manager], [contract]] = await Promise.all([
    db
      .select({
        name: placementFormats.name,
        isActive: placementFormats.isActive,
      })
      .from(placementFormats)
      .where(eq(placementFormats.id, values.formatId))
      .limit(1),
    db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.id, values.managerId),
          eq(users.isActive, true),
          inArray(users.role, ['admin', 'viewer']),
        ),
      )
      .limit(1),
    db
      .select({ id: contracts.id })
      .from(contracts)
      .where(
        and(
          eq(contracts.id, values.contractId),
          eq(contracts.advertiserId, values.advertiserId),
        ),
      )
      .limit(1),
  ])
  // Отключённый формат нельзя выбрать заново, но бронь на нём можно править.
  if (!format || (!format.isActive && values.formatId !== currentFormatId)) {
    return { ok: false, state: { errors: { formatId: 'Формат не найден' } } }
  }
  if (!manager) {
    return { ok: false, state: { errors: { managerId: 'Менеджер не найден' } } }
  }
  if (!contract) {
    return {
      ok: false,
      state: {
        errors: { contractId: 'Договор не найден у этого рекламодателя' },
      },
    }
  }
  return { ok: true, values: { ...values, date }, formatName: format.name }
}

const slotTaken = (v: BookingValues, formatName: string): FormState => ({
  errors: {
    time: `Слот занят: ${formatName} на ${formatDay(v.date)} в ${v.time} уже забронирован`,
  },
})

/** Удалить файл из Blob, не роняя действие: строка в базе важнее. */
async function dropFile(file: AttachedFile | null | undefined) {
  if (!file) return
  try {
    await del(file.pathname)
  } catch (err) {
    console.error('Не удалось удалить файл из Blob', file.pathname, err)
  }
}

function refresh() {
  revalidatePath('/calendar')
  revalidatePath('/directory')
}

/** Бронь слота. Только admin; занятый слот отсекает уникальный индекс. */
export async function createBooking(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const user = await requireRole(['admin'])
  const read = await readBooking(fd)
  if (!read.ok) return read.state
  const { values, formatName } = read

  try {
    await getDb()
      .insert(bookings)
      .values({ ...values, createdBy: user.name })
  } catch (err) {
    if (isUniqueViolation(err)) return slotTaken(values, formatName)
    throw err
  }

  refresh()
  return {
    ok: true,
    message: `Слот забронирован: ${formatDay(values.date)} ${values.time}, ${formatName}`,
  }
}

/** Правка брони. Только admin; заменённый или убранный файл удаляем из Blob. */
export async function updateBooking(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireRole(['admin'])
  const id = text(fd, 'id', 36)
  const db = getDb()
  const [existing] = await db
    .select({ formatId: bookings.formatId, file: bookings.file })
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1)
  if (!existing) return { error: 'Бронь не найдена — возможно, её уже сняли' }

  const read = await readBooking(fd, existing.formatId)
  if (!read.ok) return read.state
  const { values, formatName } = read

  try {
    await db.update(bookings).set(values).where(eq(bookings.id, id))
  } catch (err) {
    if (isUniqueViolation(err)) return slotTaken(values, formatName)
    throw err
  }

  if (existing.file && existing.file.pathname !== values.file?.pathname) {
    await dropFile(existing.file)
  }
  refresh()
  return {
    ok: true,
    message: `Бронь сохранена: ${formatDay(values.date)} ${values.time}, ${formatName}`,
  }
}

/** Снять бронь. Только admin; файл слота удаляем вместе с ней. */
export async function deleteBooking(id: string): Promise<FormState> {
  await requireRole(['admin'])
  const removed = await getDb()
    .delete(bookings)
    .where(eq(bookings.id, id))
    .returning({ id: bookings.id, file: bookings.file })
  if (!removed.length) return { error: 'Бронь уже удалена' }
  await dropFile(removed[0].file)
  refresh()
  return { ok: true, message: 'Бронь снята' }
}
