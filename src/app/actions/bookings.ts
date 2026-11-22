'use server'

import { revalidatePath } from 'next/cache'
import { and, eq, inArray } from 'drizzle-orm'
import { getDb } from '@/db'
import { bookings, contracts, placementFormats, users } from '@/db/schema'
import { requireRole } from '@/lib/auth'
import { formatDay } from '@/lib/dates'
import { parseAttachedFile } from '@/lib/files'
import { dateField, isUniqueViolation, text, type FormState } from '@/lib/forms'

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

/**
 * Бронь слота. Только admin. Слот привязан к рекламодателю и его договору;
 * занятый слот (формат + дата + время) отсекает уникальный индекс.
 */
export async function createBooking(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const user = await requireRole(['admin'])

  const date = dateField(fd, 'date')
  const time = text(fd, 'time', 5)
  const managerId = text(fd, 'managerId', 36)
  const formatId = text(fd, 'formatId', 36)
  const advertiserId = text(fd, 'advertiserId', 36)
  const contractId = text(fd, 'contractId', 36)
  const campaignName = text(fd, 'campaignName', 300)
  const comment = text(fd, 'comment', 1000)
  const file = parseAttachedFile(fd.get('file'), 'bookings')

  const errors: Record<string, string> = {}
  if (!date) errors.date = 'Укажите дату'
  if (!TIME.test(time)) errors.time = 'Укажите время'
  if (!managerId) errors.managerId = 'Выберите менеджера'
  if (!formatId) errors.formatId = 'Выберите формат'
  if (!advertiserId) errors.advertiserId = 'Выберите рекламодателя'
  if (!contractId) errors.contractId = 'Выберите договор'
  if (!campaignName) errors.campaignName = 'Укажите рекламную кампанию'
  if (Object.keys(errors).length || !date) return { errors }

  const db = getDb()
  const [[format], [manager], [contract]] = await Promise.all([
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
      .where(
        and(
          eq(users.id, managerId),
          eq(users.isActive, true),
          inArray(users.role, ['admin', 'viewer']),
        ),
      )
      .limit(1),
    // Договор обязан принадлежать выбранному бренду.
    db
      .select({ id: contracts.id })
      .from(contracts)
      .where(
        and(
          eq(contracts.id, contractId),
          eq(contracts.advertiserId, advertiserId),
        ),
      )
      .limit(1),
  ])
  if (!format) return { errors: { formatId: 'Формат не найден' } }
  if (!manager) return { errors: { managerId: 'Менеджер не найден' } }
  if (!contract) {
    return { errors: { contractId: 'Договор не найден у этого рекламодателя' } }
  }

  try {
    await db.insert(bookings).values({
      date,
      time,
      managerId,
      formatId,
      advertiserId,
      contractId,
      campaignName,
      comment,
      file,
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
