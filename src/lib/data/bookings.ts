import 'server-only'
import { and, asc, between, eq, inArray } from 'drizzle-orm'
import { getDb } from '@/db'
import {
  advertisers,
  bookingPayments,
  bookings,
  contracts,
  placementFormats,
  users,
} from '@/db/schema'
import { requireRole } from '@/lib/auth'

/**
 * Брони за период — для недели или дня календаря. Рекламодатель видит свои
 * брони полностью, а чужие — только как занятый слот формата: без бренда,
 * кампании, менеджера и файлов. Маскируем здесь, на сервере.
 */
export async function bookingsBetween(from: string, to: string) {
  const user = await requireRole(['admin', 'viewer', 'advertiser'])
  const rows = await getDb()
    .select({
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
      contractNumber: contracts.number,
      contractDiscount: contracts.discount,
      contractStart: contracts.startDate,
      contractEnd: contracts.endDate,
      contractFile: contracts.file,
    })
    .from(bookings)
    .innerJoin(placementFormats, eq(placementFormats.id, bookings.formatId))
    .leftJoin(users, eq(users.id, bookings.managerId))
    .leftJoin(advertisers, eq(advertisers.id, bookings.advertiserId))
    .leftJoin(contracts, eq(contracts.id, bookings.contractId))
    .where(between(bookings.date, from, to))
    .orderBy(
      asc(bookings.date),
      asc(bookings.time),
      asc(placementFormats.position),
    )

  // История выплат — одним запросом на все брони периода.
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
  const withPayments = rows.map((r) => {
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
    return { ...r, payments: own, paid: paid.toFixed(2) }
  })

  if (user.role !== 'advertiser') {
    return withPayments.map((r) => ({ ...r, masked: false }))
  }
  return withPayments.map((r) =>
    r.advertiserId && r.advertiserId === user.advertiserId
      ? { ...r, masked: false }
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

/** Менеджеры для брони — сотрудники площадки с активной учётной записью. */
export async function managerOptions() {
  await requireRole(['admin', 'viewer'])
  return getDb()
    .select({ id: users.id, name: users.name, role: users.role })
    .from(users)
    .where(
      and(eq(users.isActive, true), inArray(users.role, ['admin', 'viewer'])),
    )
    .orderBy(asc(users.name))
}
