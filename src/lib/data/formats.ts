import 'server-only'
import { cache } from 'react'
import { asc, count, eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { bookings, placementFormats } from '@/db/schema'
import { requireRole } from '@/lib/auth'
import { ROLES, STAFF } from '@/lib/roles'

export type PlacementFormat = typeof placementFormats.$inferSelect

/** Форматы со счётчиком броней — для справочника. Один запрос на рендер. */
export const listFormats = cache(async () => {
  await requireRole(STAFF)
  const rows = await getDb()
    .select({ format: placementFormats, bookings: count(bookings.id) })
    .from(placementFormats)
    .leftJoin(bookings, eq(bookings.formatId, placementFormats.id))
    .groupBy(placementFormats.id)
    .orderBy(asc(placementFormats.position), asc(placementFormats.name))
  return rows.map((r) => ({ ...r.format, bookingsCount: r.bookings }))
})

/** Форматы для календаря и формы брони. */
export async function formatOptions() {
  await requireRole(ROLES)
  return getDb()
    .select({
      id: placementFormats.id,
      name: placementFormats.name,
      color: placementFormats.color,
      isActive: placementFormats.isActive,
      impressions: placementFormats.impressions,
      pricePerImpression: placementFormats.pricePerImpression,
    })
    .from(placementFormats)
    .orderBy(asc(placementFormats.position), asc(placementFormats.name))
}

export type FormatOption = Awaited<ReturnType<typeof formatOptions>>[number]
