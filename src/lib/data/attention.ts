import 'server-only'
import { and, count, eq, isNull, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { bookingFacts, bookings } from '@/db/schema'
import { requireRole } from '@/lib/auth'
import { EDITORS } from '@/lib/roles'
import { planned } from './facts'

export interface AttentionItem {
  label: string
  count: number
  href: string
}

/**
 * Что ждёт сотрудника: новые заявки и вышедшие публикации без факта.
 * Это колокольчик в шапке — два счётчика, без выборки строк.
 */
export async function attentionItems(): Promise<AttentionItem[]> {
  await requireRole(EDITORS)
  const db = getDb()
  const [[sent], [noFact]] = await Promise.all([
    db.select({ n: count() }).from(bookings).where(eq(bookings.status, 'sent')),
    db
      .select({ n: count() })
      .from(bookings)
      .leftJoin(bookingFacts, eq(bookingFacts.bookingId, bookings.id))
      .where(and(sql`${planned} <= now()`, isNull(bookingFacts.bookingId))),
  ])
  return [
    {
      label: 'Новые заявки — статус «Отправлен»',
      count: sent?.n ?? 0,
      href: '/orders?status=sent&month=all',
    },
    {
      label: 'Вышли, а факт не внесён',
      count: noFact?.n ?? 0,
      href: '/facts?month=all&verdict=waiting',
    },
  ]
}
