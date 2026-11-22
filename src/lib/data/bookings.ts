import 'server-only'
import { and, asc, between, eq, inArray } from 'drizzle-orm'
import { getDb } from '@/db'
import {
  advertisers,
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

  if (user.role !== 'advertiser') {
    return rows.map((r) => ({ ...r, masked: false }))
  }
  return rows.map((r) =>
    r.advertiserId && r.advertiserId === user.advertiserId
      ? { ...r, masked: false }
      : {
          ...r,
          masked: true,
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
