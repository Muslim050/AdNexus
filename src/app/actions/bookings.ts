'use server'

import { revalidatePath } from 'next/cache'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import {
  advertisers,
  bookingFacts,
  bookingPayments,
  bookings,
  contracts,
  placementFormats,
  users,
} from '@/db/schema'
import { requireRole } from '@/lib/auth'
import { dropFile } from '@/lib/blob'
import { isBookingStatus, type BookingStatus } from '@/lib/bookings'
import { formatDay } from '@/lib/dates'
import { parseAttachedFile, type AttachedFile } from '@/lib/files'
import {
  dateField,
  isUniqueViolation,
  numberField,
  text,
  type FormState,
} from '@/lib/forms'
import { suggestedAmount } from '@/lib/pricing'
import {
  BOOKERS,
  EDITORS,
  isEditor,
  type SessionUser,
  STAFF,
} from '@/lib/roles'

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
  amount: string
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
  /** Бронь при правке: её формат и бренд остаются доступны. */
  current?: {
    formatId: string
    advertiserId: string | null
    file: AttachedFile | null
  },
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
  const typedAmount = isAdvertiser ? 0 : numberField(fd, 'amount')
  if (typedAmount === false) errors.amount = 'Сумма — число, например 1 500 000'
  if (Object.keys(errors).length || !date || typedAmount === false) {
    return { ok: false, state: { errors } }
  }

  const db = getDb()
  const [[format], managerOk, [contract], [brand]] = await Promise.all([
    db
      .select({
        name: placementFormats.name,
        isActive: placementFormats.isActive,
        impressions: placementFormats.impressions,
        pricePerImpression: placementFormats.pricePerImpression,
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
              inArray(users.role, STAFF),
            ),
          )
          .limit(1)
          .then((r) => r.length > 0)
      : Promise.resolve(true),
    db
      .select({ id: contracts.id, discount: contracts.discount })
      .from(contracts)
      .where(
        and(
          eq(contracts.id, values.contractId),
          eq(contracts.advertiserId, values.advertiserId),
        ),
      )
      .limit(1),
    db
      .select({
        status: advertisers.status,
        creativeRequired: advertisers.creativeRequired,
      })
      .from(advertisers)
      .where(eq(advertisers.id, values.advertiserId))
      .limit(1),
  ])
  // Отключённый формат нельзя выбрать заново, но бронь на нём можно править.
  if (!format || (!format.isActive && values.formatId !== current?.formatId)) {
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
  // Отключённый бренд новых броней не получает, старые править можно.
  if (
    brand?.status === 'paused' &&
    values.advertiserId !== current?.advertiserId
  ) {
    return {
      ok: false,
      state: { errors: { advertiserId: 'Рекламодатель отключён' } },
    }
  }
  // «Рекламный ролик обязателен»: у новой брони файл нужен, а у старой его
  // нельзя убрать. Брони, созданные до включения флага, правятся как раньше.
  if (
    brand?.creativeRequired &&
    !values.file &&
    (!current || current.file || current.advertiserId !== values.advertiserId)
  ) {
    return {
      ok: false,
      state: {
        errors: { file: 'Для этого рекламодателя ролик обязателен' },
      },
    }
  }
  // Сумму вводит admin; заявке рекламодателя считаем её сами: пакет − скидка.
  const amount = isAdvertiser
    ? suggestedAmount(format, contract.discount)
    : typedAmount
  return {
    ok: true,
    values: { ...values, date, amount: amount.toFixed(2) },
    formatName: format.name,
  }
}

const slotTaken = (v: BookingValues, formatName: string): FormState => ({
  errors: {
    time: `Слот занят: ${formatName} на ${formatDay(v.date)} в ${v.time} уже забронирован`,
  },
})

function refresh() {
  revalidatePath('/calendar')
  revalidatePath('/orders')
  revalidatePath('/directory')
  revalidatePath('/facts')
}

/** Бронь, которую пользователь вправе менять: admin — любую, рекламодатель — свою и пока «Отправлен». */
async function editableBooking(id: string, user: SessionUser) {
  const [row] = await getDb()
    .select({
      formatId: bookings.formatId,
      contractId: bookings.contractId,
      amount: bookings.amount,
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
  const user = await requireRole(BOOKERS)
  const read = await readBooking(fd, user)
  if (!read.ok) return read.state
  const { values, formatName } = read

  const requested = text(fd, 'status', 20)
  const status: BookingStatus =
    isEditor(user.role) && isBookingStatus(requested) ? requested : 'sent'

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
  const user = await requireRole(BOOKERS)
  const id = text(fd, 'id', 36)
  const found = await editableBooking(id, user)
  if ('error' in found) return { error: found.error }
  const existing = found.row

  const read = await readBooking(fd, user, existing)
  if (!read.ok) return read.state
  const { values, formatName } = read

  const requested = text(fd, 'status', 20)
  const status =
    isEditor(user.role) && isBookingStatus(requested)
      ? requested
      : existing.status

  // Сумму, которую вписала площадка, рекламодатель не затирает: пересчитываем
  // её, только если сменились формат или договор — то, из чего она складывается.
  const samePrice =
    values.formatId === existing.formatId &&
    values.contractId === existing.contractId

  try {
    await getDb()
      .update(bookings)
      // Менеджера, назначенного площадкой, рекламодатель не сбрасывает.
      .set(
        user.role === 'advertiser'
          ? {
              ...values,
              managerId: undefined,
              amount: samePrice ? existing.amount : values.amount,
              status,
            }
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
  await requireRole(EDITORS)
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
  const user = await requireRole(BOOKERS)
  const found = await editableBooking(id, user)
  if ('error' in found) return { error: found.error }
  // Бронь с поступлениями или фактом не снимаем: вместе с ней пропала бы
  // история выплат и стыковка.
  // Условие — в самом запросе, чтобы выплата не проскочила между проверкой
  // и удалением.
  const removed = await getDb()
    .delete(bookings)
    .where(
      and(
        eq(bookings.id, id),
        sql`not exists (select 1 from ${bookingPayments} p where p.booking_id = ${bookings.id})`,
        sql`not exists (select 1 from ${bookingFacts} f where f.booking_id = ${bookings.id})`,
      ),
    )
    .returning({ id: bookings.id, file: bookings.file })
  if (!removed.length) {
    return {
      error:
        'По брони есть поступления или факт публикации — сначала удалите их',
    }
  }
  await dropFile(removed[0].file)
  refresh()
  return {
    ok: true,
    message: user.role === 'advertiser' ? 'Заявка отменена' : 'Бронь снята',
  }
}

/** Поступление по брони — в историю выплат. Только admin. */
export async function addBookingPayment(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const user = await requireRole(EDITORS)
  const bookingId = text(fd, 'bookingId', 36)
  const amount = numberField(fd, 'amount')
  const date = dateField(fd, 'date')
  const time = text(fd, 'time', 5)
  const comment = text(fd, 'comment', 500)

  const errors: Record<string, string> = {}
  if (amount === false || amount <= 0) errors.amount = 'Сумма больше нуля'
  if (!date) errors.date = 'Укажите дату'
  if (!TIME.test(time)) errors.time = 'Укажите время'
  if (Object.keys(errors).length || amount === false || !date) {
    return { errors }
  }

  const [booking] = await getDb()
    .select({ id: bookings.id })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1)
  if (!booking) return { error: 'Бронь не найдена' }

  await getDb()
    .insert(bookingPayments)
    .values({
      bookingId,
      amount: amount.toFixed(2),
      // Дата и время — по Ташкенту.
      paidAt: new Date(`${date}T${time}:00+05:00`),
      comment,
      createdBy: user.name,
    })
  refresh()
  return {
    ok: true,
    message: `Поступление ${amount.toLocaleString('ru-RU')} сум внесено`,
  }
}

/** Удалить ошибочное поступление. Только admin. */
export async function deleteBookingPayment(id: string): Promise<FormState> {
  await requireRole(EDITORS)
  const removed = await getDb()
    .delete(bookingPayments)
    .where(eq(bookingPayments.id, id))
    .returning({ id: bookingPayments.id })
  if (!removed.length) return { error: 'Поступление уже удалено' }
  refresh()
  return { ok: true, message: 'Поступление удалено' }
}
