import 'server-only'
import {
  and,
  asc,
  between,
  desc,
  eq,
  gte,
  inArray,
  lt,
  sql,
  type SQL,
} from 'drizzle-orm'
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
import { ROLES, STAFF } from '@/lib/roles'

/** Поля брони для календаря, списка и карточки — один набор везде. */
export const bookingFields = {
  id: bookings.id,
  date: bookings.date,
  time: bookings.time,
  status: bookings.status,
  amount: bookings.amount,
  campaignName: bookings.campaignName,
  comment: bookings.comment,
  file: bookings.file,
  createdBy: bookings.createdBy,
  formatId: bookings.formatId,
  formatName: placementFormats.name,
  color: placementFormats.color,
  managerId: bookings.managerId,
  managerName: users.name,
  advertiserId: bookings.advertiserId,
  contractId: bookings.contractId,
  advertiserName: advertisers.name,
  advertiserLogo: advertisers.logo,
  advertiserColor: advertisers.color,
  planImpressions: placementFormats.impressions,
  /** Факт публикации — «Стыковка»; null, пока не внесён. */
  fact: {
    outcome: bookingFacts.outcome,
    publishedAt: bookingFacts.publishedAt,
    link: bookingFacts.link,
    impressions: bookingFacts.impressions,
    planImpressions: bookingFacts.planImpressions,
    screenshot: bookingFacts.screenshot,
    comment: bookingFacts.comment,
    createdBy: bookingFacts.createdBy,
  },
  contractNumber: contracts.number,
  contractDiscount: contracts.discount,
  contractStart: contracts.startDate,
  contractEnd: contracts.endDate,
  contractFile: contracts.file,
}

/** Брони с присоединёнными форматом, менеджером, брендом и договором. */
export function bookingsQuery(where: SQL | undefined) {
  return getDb()
    .select(bookingFields)
    .from(bookings)
    .innerJoin(placementFormats, eq(placementFormats.id, bookings.formatId))
    .leftJoin(users, eq(users.id, bookings.managerId))
    .leftJoin(advertisers, eq(advertisers.id, bookings.advertiserId))
    .leftJoin(contracts, eq(contracts.id, bookings.contractId))
    .leftJoin(bookingFacts, eq(bookingFacts.bookingId, bookings.id))
    .where(where)
}

type BookingRow = Awaited<ReturnType<typeof bookingsQuery>>[number]

/** История выплат — одним запросом на все брони; оплачено — их сумма. */
export async function withPayments<T extends BookingRow>(rows: T[]) {
  const ids = rows.map((r) => r.id)
  const payments = ids.length
    ? await getDb()
        .select({
          id: bookingPayments.id,
          bookingId: bookingPayments.bookingId,
          amount: bookingPayments.amount,
          paidAt: bookingPayments.paidAt,
          comment: bookingPayments.comment,
          createdBy: bookingPayments.createdBy,
        })
        .from(bookingPayments)
        .where(inArray(bookingPayments.bookingId, ids))
        .orderBy(asc(bookingPayments.paidAt), asc(bookingPayments.seq))
    : []
  return rows.map((r) => {
    const own = payments
      .filter((p) => p.bookingId === r.id)
      .map((p) => ({
        id: p.id,
        amount: p.amount,
        paidAt: p.paidAt.toISOString(),
        comment: p.comment,
        createdBy: p.createdBy,
      }))
    const paid = own.reduce((sum, p) => sum + Number(p.amount), 0)
    return { ...r, payments: own, paid: paid.toFixed(2), masked: false }
  })
}

/**
 * Брони за период — для недели или дня календаря. Рекламодатель видит свои
 * брони полностью, а чужие — только как занятый слот формата: без бренда,
 * кампании, менеджера и файлов. Маскируем здесь, на сервере.
 */
export async function bookingsBetween(from: string, to: string) {
  const user = await requireRole(ROLES)
  const rows = await withPayments(
    await bookingsQuery(between(bookings.date, from, to)).orderBy(
      asc(bookings.date),
      asc(bookings.time),
      asc(placementFormats.position),
    ),
  )

  if (user.role !== 'advertiser') return rows
  return rows.map((r) =>
    r.advertiserId && r.advertiserId === user.advertiserId
      ? r
      : {
          ...r,
          masked: true,
          amount: '0',
          paid: '0',
          payments: [],
          status: 'active' as const,
          campaignName: '',
          comment: '',
          file: null,
          createdBy: '',
          managerId: null,
          managerName: null,
          advertiserId: null,
          contractId: null,
          advertiserName: null,
          advertiserLogo: null,
          advertiserColor: null,
          planImpressions: 0,
          fact: null,
          contractNumber: null,
          contractDiscount: null,
          contractStart: null,
          contractEnd: null,
          contractFile: null,
        },
  )
}

export type CalendarBooking = Awaited<
  ReturnType<typeof bookingsBetween>
>[number]

/** Список справа от календаря: рекламодателю — только его публикации. */
async function listScope() {
  const user = await requireRole(ROLES)
  if (user.role !== 'advertiser') return undefined
  return user.advertiserId
    ? eq(bookings.advertiserId, user.advertiserId)
    : sql`false`
}

/** Публикации с `from` по `to` — день или неделя списка, целиком. */
export async function listedBookings(from: string, to: string) {
  const rows = await bookingsQuery(
    and(between(bookings.date, from, to), await listScope()),
  ).orderBy(
    asc(bookings.date),
    asc(bookings.time),
    asc(placementFormats.position),
    asc(bookings.id),
  )
  return { rows: await withPayments(rows), moreBefore: false, moreAfter: false }
}

const FEED_PAST = 30
const FEED_AHEAD = 40

/**
 * Лента «Все» вокруг сегодняшнего дня: `up` порций прошлого и `down` порций
 * с сегодня. Лишняя строка в запросе говорит, есть ли что грузить дальше.
 */
export async function feedBookings(today: string, up: number, down: number) {
  const scope = await listScope()
  const [past, ahead] = [up * FEED_PAST, down * FEED_AHEAD]
  const [before, after] = await Promise.all([
    bookingsQuery(and(lt(bookings.date, today), scope))
      .orderBy(
        desc(bookings.date),
        desc(bookings.time),
        desc(placementFormats.position),
        desc(bookings.id),
      )
      .limit(past + 1),
    bookingsQuery(and(gte(bookings.date, today), scope))
      .orderBy(
        asc(bookings.date),
        asc(bookings.time),
        asc(placementFormats.position),
        asc(bookings.id),
      )
      .limit(ahead + 1),
  ])
  return {
    rows: await withPayments([
      ...before.slice(0, past).reverse(),
      ...after.slice(0, ahead),
    ]),
    moreBefore: before.length > past,
    moreAfter: after.length > ahead,
  }
}

/** Менеджеры для брони — сотрудники площадки с активной учётной записью. */
export async function managerOptions() {
  await requireRole(STAFF)
  return getDb()
    .select({ id: users.id, name: users.name, role: users.role })
    .from(users)
    .where(and(eq(users.isActive, true), inArray(users.role, STAFF)))
    .orderBy(asc(users.name))
}
