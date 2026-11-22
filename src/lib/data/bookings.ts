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

/** Брони за период — для недели или дня календаря. */
export async function bookingsBetween(from: string, to: string) {
  await requireRole(['admin', 'viewer'])
  return getDb()
    .select({
      id: bookings.id,
      date: bookings.date,
      time: bookings.time,
      campaignName: bookings.campaignName,
      comment: bookings.comment,
      file: bookings.file,
      createdBy: bookings.createdBy,
      formatId: bookings.formatId,
      formatName: placementFormats.name,
      color: placementFormats.color,
      managerName: users.name,
      advertiserName: advertisers.name,
      contractNumber: contracts.number,
      contractDiscount: contracts.discount,
      contractStart: contracts.startDate,
      contractEnd: contracts.endDate,
      contractFile: contracts.file,
    })
    .from(bookings)
    .innerJoin(placementFormats, eq(placementFormats.id, bookings.formatId))
    .innerJoin(users, eq(users.id, bookings.managerId))
    .leftJoin(advertisers, eq(advertisers.id, bookings.advertiserId))
    .leftJoin(contracts, eq(contracts.id, bookings.contractId))
    .where(between(bookings.date, from, to))
    .orderBy(
      asc(bookings.date),
      asc(bookings.time),
      asc(placementFormats.position),
    )
}

export type CalendarBooking = Awaited<
  ReturnType<typeof bookingsBetween>
>[number]

/**
 * Менеджеры для брони — сотрудники площадки с активной учётной записью.
 * Учётные записи рекламодателей сюда не попадают.
 */
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
