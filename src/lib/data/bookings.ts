import 'server-only'
import { and, asc, between, eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { bookings, placementFormats, users } from '@/db/schema'
import { requireRole } from '@/lib/auth'

/** Брони за период — для недели календаря. */
export async function bookingsBetween(from: string, to: string) {
  await requireRole(['admin', 'viewer'])
  return getDb()
    .select({
      id: bookings.id,
      date: bookings.date,
      time: bookings.time,
      orderRef: bookings.orderRef,
      comment: bookings.comment,
      createdBy: bookings.createdBy,
      createdAt: bookings.createdAt,
      formatId: bookings.formatId,
      formatName: placementFormats.name,
      color: placementFormats.color,
      managerId: bookings.managerId,
      managerName: users.name,
    })
    .from(bookings)
    .innerJoin(placementFormats, eq(placementFormats.id, bookings.formatId))
    .innerJoin(users, eq(users.id, bookings.managerId))
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

/** Менеджеры для формы брони — активные учётные записи площадки. */
export async function managerOptions() {
  await requireRole(['admin', 'viewer'])
  return getDb()
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(and(eq(users.isActive, true)))
    .orderBy(asc(users.name))
}
