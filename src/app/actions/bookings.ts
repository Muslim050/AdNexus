'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { bookings, placementFormats, users } from '@/db/schema'
import { requireRole } from '@/lib/auth'
import { dateField, isUniqueViolation, text, type FormState } from '@/lib/forms'
import { formatDay } from '@/lib/dates'

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

/** Бронь слота. Только admin; занятый слот отсекает уникальный индекс. */
export async function createBooking(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const user = await requireRole(['admin'])

  const date = dateField(fd, 'date')
  const time = text(fd, 'time', 5)
  const formatId = text(fd, 'formatId', 36)
  const managerId = text(fd, 'managerId', 36)
  const orderRef = text(fd, 'orderRef', 100)
  const comment = text(fd, 'comment', 1000)

  const errors: Record<string, string> = {}
  if (!date) errors.date = 'Укажите дату'
  if (!TIME.test(time)) errors.time = 'Укажите время'
  if (!formatId) errors.formatId = 'Выберите формат'
  if (!managerId) errors.managerId = 'Выберите менеджера'
  if (Object.keys(errors).length || !date) return { errors }

  const db = getDb()
  const [[format], [manager]] = await Promise.all([
    db
      .select({ name: placementFormats.name })
      .from(placementFormats)
      .where(
        and(
          eq(placementFormats.id, formatId),
          eq(placementFormats.isActive, true),
        ),
      )
      .limit(1),
    db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, managerId), eq(users.isActive, true)))
      .limit(1),
  ])
  if (!format) return { errors: { formatId: 'Формат не найден' } }
  if (!manager) return { errors: { managerId: 'Менеджер не найден' } }

  try {
    await db.insert(bookings).values({
      date,
      time,
      formatId,
      managerId,
      orderRef,
      comment,
      createdBy: user.name,
    })
  } catch (err) {
    if (isUniqueViolation(err)) {
      return {
        errors: {
          time: `Слот занят: ${format.name} на ${formatDay(date)} в ${time} уже забронирован`,
        },
      }
    }
    throw err
  }

  revalidatePath('/calendar')
  revalidatePath('/directory')
  return {
    ok: true,
    message: `Слот забронирован: ${formatDay(date)} ${time}, ${format.name}`,
  }
}

/** Снять бронь. Только admin. */
export async function deleteBooking(id: string): Promise<FormState> {
  await requireRole(['admin'])
  const removed = await getDb()
    .delete(bookings)
    .where(eq(bookings.id, id))
    .returning({ id: bookings.id })
  if (!removed.length) return { error: 'Бронь уже удалена' }
  revalidatePath('/calendar')
  revalidatePath('/directory')
  return { ok: true, message: 'Бронь снята' }
}
