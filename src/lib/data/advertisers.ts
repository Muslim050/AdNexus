import 'server-only'
import { asc, count, eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { advertisers, contracts } from '@/db/schema'
import { requireRole } from '@/lib/auth'

export type AdvertiserRow = typeof advertisers.$inferSelect & {
  contractsCount: number
}

/** Рекламодатели для площадки: admin и viewer. */
export async function listAdvertisers(): Promise<AdvertiserRow[]> {
  await requireRole(['admin', 'viewer'])
  const rows = await getDb()
    .select({ advertiser: advertisers, contractsCount: count(contracts.id) })
    .from(advertisers)
    .leftJoin(contracts, eq(contracts.advertiserId, advertisers.id))
    .groupBy(advertisers.id)
    .orderBy(asc(advertisers.name))
  return rows.map((r) => ({
    ...r.advertiser,
    contractsCount: r.contractsCount,
  }))
}

/** Короткий список для выбора в формах. */
export async function advertiserOptions() {
  await requireRole(['admin', 'viewer'])
  return getDb()
    .select({
      id: advertisers.id,
      name: advertisers.name,
      legalName: advertisers.legalName,
    })
    .from(advertisers)
    .orderBy(asc(advertisers.name))
}
