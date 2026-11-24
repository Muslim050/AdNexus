'use server'

import { revalidatePath } from 'next/cache'
import { and, eq, ne } from 'drizzle-orm'
import { getDb } from '@/db'
import { bookingFacts, bookings, placementFormats } from '@/db/schema'
import { requireRole } from '@/lib/auth'
import { dropFile } from '@/lib/blob'
import { VERDICT, checkFact, isFactOutcome, plannedAt } from '@/lib/facts'
import { parseAttachedFile } from '@/lib/files'
import { dateField, numberField, text, type FormState } from '@/lib/forms'
import { EDITORS } from '@/lib/roles'

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

function refresh() {
  revalidatePath('/facts')
  revalidatePath('/calendar')
  revalidatePath('/orders')
}

/** Ссылка на публикацию: только http(s), иначе false. Пусто — можно. */
function linkField(fd: FormData): string | false {
  const raw = text(fd, 'link', 1000)
  if (!raw) return ''
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
    const ok =
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      url.hostname.includes('.')
    return ok ? url.href : false
  } catch {
    return false
  }
}

/**
 * Внести или поправить факт публикации. Когда план и факт сошлись, бронь
 * становится «Выполнен»; обратно статус сам не возвращаем.
 */
export async function saveFact(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const user = await requireRole(EDITORS)
  const bookingId = text(fd, 'bookingId', 36)
  const outcome = text(fd, 'outcome', 20)
  const date = dateField(fd, 'date')
  const time = text(fd, 'time', 5)
  const link = linkField(fd)
  const rawImpressions = text(fd, 'impressions', 32)
  const impressions = numberField(fd, 'impressions', { integer: true })
  const comment = text(fd, 'comment', 1000)
  const screenshot = parseAttachedFile(fd.get('screenshot'), 'facts')

  const errors: Record<string, string> = {}
  if (!isFactOutcome(outcome)) return { error: 'Выберите, вышла ли публикация' }
  const published = outcome === 'published'
  if (published) {
    if (!date) errors.date = 'Укажите дату'
    if (!TIME.test(time)) errors.time = 'Укажите время'
    if (link === false) errors.link = 'Проверьте ссылку'
    if (impressions === false)
      errors.impressions = 'Целое число, например 25 000'
  } else if (!comment) {
    errors.comment = 'Напишите, почему публикация не вышла'
  }
  if (Object.keys(errors).length) return { errors }

  const db = getDb()
  const [booking] = await db
    .select({
      date: bookings.date,
      time: bookings.time,
      planImpressions: placementFormats.impressions,
      fact: bookingFacts,
    })
    .from(bookings)
    .innerJoin(placementFormats, eq(placementFormats.id, bookings.formatId))
    .leftJoin(bookingFacts, eq(bookingFacts.bookingId, bookings.id))
    .where(eq(bookings.id, bookingId))
    .limit(1)
  if (!booking) return { error: 'Бронь не найдена — возможно, её уже сняли' }

  const now = Date.now()
  const publishedAt = published ? new Date(`${date}T${time}:00+05:00`) : null
  if (publishedAt && publishedAt.getTime() > now + 60_000) {
    return { errors: { date: 'Это время ещё не наступило' } }
  }
  if (!published && plannedAt(booking.date, booking.time).getTime() > now) {
    return { error: 'Время публикации ещё не пришло' }
  }

  const values = {
    outcome,
    publishedAt,
    link: published ? link || '' : '',
    impressions:
      published && rawImpressions && impressions !== false ? impressions : null,
    screenshot: published ? screenshot : null,
    comment,
    // План запоминаем один раз — при первом внесении.
    planImpressions: booking.fact?.planImpressions ?? booking.planImpressions,
    createdBy: user.name,
  }
  await db
    .insert(bookingFacts)
    .values({ bookingId, ...values })
    .onConflictDoUpdate({
      target: bookingFacts.bookingId,
      set: { ...values, updatedAt: new Date() },
    })

  const old = booking.fact?.screenshot
  if (old && old.pathname !== values.screenshot?.pathname) await dropFile(old)

  const { verdict, notes } = checkFact(booking, values)
  if (verdict === 'matched') {
    await db
      .update(bookings)
      .set({ status: 'completed' })
      .where(and(eq(bookings.id, bookingId), ne(bookings.status, 'completed')))
  }
  refresh()
  return {
    ok: true,
    message: [`Факт внесён: ${VERDICT[verdict].label.toLowerCase()}`, ...notes]
      .slice(0, 2)
      .join(' · '),
  }
}

/** Убрать ошибочный факт: публикация снова ждёт стыковки. */
export async function deleteFact(bookingId: string): Promise<FormState> {
  await requireRole(EDITORS)
  const removed = await getDb()
    .delete(bookingFacts)
    .where(eq(bookingFacts.bookingId, bookingId))
    .returning({ screenshot: bookingFacts.screenshot })
  if (!removed.length) return { error: 'Факт уже удалён' }
  await dropFile(removed[0].screenshot)
  refresh()
  return { ok: true, message: 'Факт удалён' }
}
