import 'server-only'
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  or,
  sql,
  type SQL,
} from 'drizzle-orm'
import { getDb } from '@/db'
import { advertisers, bookings, contracts, placementFormats } from '@/db/schema'
import { requireRole } from '@/lib/auth'
import { BOOKING_STATUSES, type BookingStatus } from '@/lib/bookings'
import { todayTashkent } from '@/lib/week'
import { bookingsQuery, withPayments } from './bookings'

/** Фильтр списка: статус, «Предстоящие» (с сегодняшнего дня) или «Все». */
export type OrdersFilter = BookingStatus | 'upcoming' | 'all'

export interface OrdersQuery {
  status: OrdersFilter
  /** 'YYYY-MM' или undefined — за всё время. */
  month?: string
  formatId?: string
  q?: string
  page: number
}

export const ORDERS_PAGE_SIZE = 20

/** Оплачено по брони — сумма поступлений. */
const paidSql = sql<string>`coalesce((select sum(p.amount) from booking_payments p where p.booking_id = ${bookings.id}), 0)`

/**
 * Список публикаций для «Заказов и медиапланов»: страница, счётчики по
 * статусам и итоги за месяц. Рекламодателю — только его бренд.
 */
export async function listOrders(query: OrdersQuery) {
  const user = await requireRole(['admin', 'viewer', 'advertiser'])
  const today = todayTashkent()

  const scope: SQL[] = []
  if (user.role === 'advertiser') {
    scope.push(
      user.advertiserId
        ? eq(bookings.advertiserId, user.advertiserId)
        : sql`false`,
    )
  }
  if (query.month) {
    scope.push(sql`to_char(${bookings.date}, 'YYYY-MM') = ${query.month}`)
  }
  if (query.formatId) scope.push(eq(bookings.formatId, query.formatId))

  // Поиск — по всем месяцам: кампанию ищут по названию, а не по дате.
  const search: SQL[] = []
  if (query.q) {
    const like = `%${query.q.replace(/[%_]/g, '\\$&')}%`
    search.push(
      or(
        ilike(bookings.campaignName, like),
        ilike(advertisers.name, like),
        ilike(contracts.number, like),
        ilike(placementFormats.name, like),
        ilike(bookings.comment, like),
      )!,
    )
  }

  const statusCond =
    query.status === 'upcoming'
      ? gte(bookings.date, today)
      : query.status === 'all'
        ? undefined
        : eq(bookings.status, query.status)

  const listWhere = and(...scope, ...search, statusCond)
  const countWhere = and(...scope, ...search)

  const db = getDb()
  const [rows, totalRow, countRows, statsRow] = await Promise.all([
    bookingsQuery(listWhere)
      .orderBy(
        query.status === 'upcoming' ? asc(bookings.date) : desc(bookings.date),
        asc(bookings.time),
      )
      .limit(ORDERS_PAGE_SIZE)
      .offset((query.page - 1) * ORDERS_PAGE_SIZE),
    db
      .select({ n: count() })
      .from(bookings)
      .innerJoin(placementFormats, eq(placementFormats.id, bookings.formatId))
      .leftJoin(advertisers, eq(advertisers.id, bookings.advertiserId))
      .leftJoin(contracts, eq(contracts.id, bookings.contractId))
      .where(listWhere),
    db
      .select({
        status: bookings.status,
        n: count(),
        upcoming:
          sql<number>`count(*) filter (where ${bookings.date} >= ${today})`.mapWith(
            Number,
          ),
      })
      .from(bookings)
      .innerJoin(placementFormats, eq(placementFormats.id, bookings.formatId))
      .leftJoin(advertisers, eq(advertisers.id, bookings.advertiserId))
      .leftJoin(contracts, eq(contracts.id, bookings.contractId))
      .where(countWhere)
      .groupBy(bookings.status),
    // Итоги — по тем же броням, что и счётчики: месяц, формат и поиск, без
    // статуса. Остаток считаем по каждой брони: переплата одной не гасит
    // долг другой.
    db
      .select({
        events: count(),
        total: sql<string>`coalesce(sum(${bookings.amount}), 0)`,
        paid: sql<string>`coalesce(sum(${paidSql}), 0)`,
        remaining: sql<string>`coalesce(sum(greatest(${bookings.amount} - ${paidSql}, 0)), 0)`,
      })
      .from(bookings)
      .innerJoin(placementFormats, eq(placementFormats.id, bookings.formatId))
      .leftJoin(advertisers, eq(advertisers.id, bookings.advertiserId))
      .leftJoin(contracts, eq(contracts.id, bookings.contractId))
      .where(countWhere),
  ])

  const counts = Object.fromEntries(
    [...BOOKING_STATUSES, 'upcoming', 'all'].map((k) => [k, 0]),
  ) as Record<OrdersFilter, number>
  for (const r of countRows) {
    counts[r.status] = r.n
    counts.all += r.n
    counts.upcoming += r.upcoming
  }

  const total = Number(statsRow[0]?.total ?? 0)
  const paid = Number(statsRow[0]?.paid ?? 0)

  return {
    rows: await withPayments(rows),
    total: totalRow[0]?.n ?? 0,
    counts,
    stats: {
      events: statsRow[0]?.events ?? 0,
      total,
      paid,
      remaining: Number(statsRow[0]?.remaining ?? 0),
    },
  }
}
