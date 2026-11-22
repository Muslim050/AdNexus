'use server'

import { revalidatePath } from 'next/cache'
import { and, eq, inArray } from 'drizzle-orm'
import { del } from '@vercel/blob'
import { getDb } from '@/db'
import { bookings, contracts, placementFormats, users } from '@/db/schema'
import { requireRole } from '@/lib/auth'
import { isBookingStatus, type BookingStatus } from '@/lib/bookings'
import { formatDay } from '@/lib/dates'
import { parseAttachedFile, type AttachedFile } from '@/lib/files'
import { dateField, isUniqueViolation, text, type FormState } from '@/lib/forms'
import type { SessionUser } from '@/lib/roles'

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

interface BookingValues {
  date: string
  time: string
  managerId: string | null
  formatId: string
  advertiserId: string
  contractId: string
  campaignName: string
  comment: string
  file: AttachedFile | null
}

/**
 * Поля брони из формы и проверка связей.
 * - admin выбирает менеджера и любого рекламодателя;
 * - рекламодатель бронирует только за свой бренд, менеджера назначит admin.
 * Формат активен (или это формат самой брони при правке), договор — у бренда.
 */
async function readBooking(
  fd: FormData,
  user: SessionUser,
  currentFormatId?: string,
): Promise<
  | { ok: true; values: BookingValues; formatName: string }
  | { ok: false; state: FormState }
> {
  const isAdvertiser = user.role === 'advertiser'
  const date = dateField(fd, 'date')
  const values = {
    time: text(fd, 'time', 5),
    managerId: isAdvertiser ? null : text(fd, 'managerId', 36),
    formatId: text(fd, 'formatId', 36),
    // Бренд рекламодателя берём из сессии, а не из формы.
    advertiserId: isAdvertiser
      ? (user.advertiserId ?? '')
      : text(fd, 'advertiserId', 36),
    contractId: text(fd, 'contractId', 36),
    campaignName: text(fd, 'campaignName', 300),
    comment: text(fd, 'comment', 1000),
    file: parseAttachedFile(fd.get('file'), 'bookings'),
  }

  const errors: Record<string, string> = {}
  if (!date) errors.date = 'Укажите дату'
  if (!TIME.test(values.time)) errors.time = 'Укажите время'
  if (!isAdvertiser && !values.managerId)
    errors.managerId = 'Выберите менеджера'
  if (!values.formatId) errors.formatId = 'Выберите формат'
  if (!values.advertiserId) {
    errors.advertiserId = isAdvertiser
      ? 'Учётная запись не привязана к бренду — обратитесь к менеджеру'
      : 'Выберите рекламодателя'
  }
  if (!values.contractId) errors.contractId = 'Выберите договор'
  if (!values.campaignName) errors.campaignName = 'Укажите рекламную кампанию'
  if (Object.keys(errors).length || !date) {
    return { ok: false, state: { errors } }
  }

  const db = getDb()
  const [[format], managerOk, [contract]] = await Promise.all([
    db
      .select({
        name: placementFormats.name,
        isActive: placementFormats.isActive,
      })
      .from(placementFormats)
      .where(eq(placementFormats.id, values.formatId))
      .limit(1),
    values.managerId
      ? db
          .select({ id: users.id })
          .from(users)
          .where(
            and(
              eq(users.id, values.managerId),
              eq(users.isActive, true),
              inArray(users.role, ['admin', 'viewer']),
            ),
          )
          .limit(1)
          .then((r) => r.length > 0)
      : Promise.resolve(true),
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
  if (!managerOk) {
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

/** Бронь, которую пользователь вправе менять: admin — любую, рекламодатель — свою и пока «Отправлен». */
async function editableBooking(id: string, user: SessionUser) {
  const [row] = await getDb()
    .select({
      formatId: bookings.formatId,
      file: bookings.file,
      status: bookings.status,
      advertiserId: bookings.advertiserId,
    })
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1)
  if (!row) return { error: 'Бронь не найдена — возможно, её уже сняли' }
  if (user.role === 'advertiser') {
    if (!user.advertiserId || row.advertiserId !== user.advertiserId) {
      return { error: 'Нет доступа к этой брони' }
    }
    if (row.status !== 'sent') {
      return {
        error: 'Бронь уже принята в работу — изменить её может только менеджер',
      }
    }
  }
  return { row }
}

/**
 * Бронь слота: admin или рекламодатель. Бронь рекламодателя всегда
 * начинается со статуса «Отправлен»; admin выбирает статус сам.
 */
export async function createBooking(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const user = await requireRole(['admin', 'advertiser'])
  const read = await readBooking(fd, user)
  if (!read.ok) return read.state
  const { values, formatName } = read

  const requested = text(fd, 'status', 20)
  const status: BookingStatus =
    user.role === 'admin' && isBookingStatus(requested) ? requested : 'sent'

  try {
    await getDb()
      .insert(bookings)
      .values({ ...values, status, createdBy: user.name })
  } catch (err) {
    if (isUniqueViolation(err)) return slotTaken(values, formatName)
    throw err
  }

  refresh()
  return {
    ok: true,
    message:
      user.role === 'advertiser'
        ? `Заявка отправлена: ${formatDay(values.date)} ${values.time}, ${formatName}`
        : `Слот забронирован: ${formatDay(values.date)} ${values.time}, ${formatName}`,
  }
}

/** Правка брони; заменённый или убранный файл удаляем из Blob. */
export async function updateBooking(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const user = await requireRole(['admin', 'advertiser'])
  const id = text(fd, 'id', 36)
  const found = await editableBooking(id, user)
  if ('error' in found) return { error: found.error }
  const existing = found.row

  const read = await readBooking(fd, user, existing.formatId)
  if (!read.ok) return read.state
  const { values, formatName } = read

  const requested = text(fd, 'status', 20)
  const status =
    user.role === 'admin' && isBookingStatus(requested)
      ? requested
      : existing.status

  try {
    await getDb()
      .update(bookings)
      // Менеджера, назначенного площадкой, рекламодатель не сбрасывает.
      .set(
        user.role === 'advertiser'
          ? { ...values, managerId: undefined, status }
          : { ...values, status },
      )
      .where(eq(bookings.id, id))
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

/** Смена статуса брони. Только admin. */
export async function setBookingStatus(
  id: string,
  status: string,
): Promise<FormState> {
  await requireRole(['admin'])
  if (!isBookingStatus(status)) return { error: 'Неизвестный статус' }
  const updated = await getDb()
    .update(bookings)
    .set({ status })
    .where(eq(bookings.id, id))
    .returning({ id: bookings.id })
  if (!updated.length) return { error: 'Бронь не найдена' }
  refresh()
  return { ok: true }
}

/** Снять бронь: admin — любую, рекламодатель — свою, пока «Отправлен». */
export async function deleteBooking(id: string): Promise<FormState> {
  const user = await requireRole(['admin', 'advertiser'])
  const found = await editableBooking(id, user)
  if ('error' in found) return { error: found.error }
  const removed = await getDb()
    .delete(bookings)
    .where(eq(bookings.id, id))
    .returning({ id: bookings.id, file: bookings.file })
  if (!removed.length) return { error: 'Бронь уже удалена' }
  await dropFile(removed[0].file)
  refresh()
  return {
    ok: true,
    message: user.role === 'advertiser' ? 'Заявка отменена' : 'Бронь снята',
  }
}
