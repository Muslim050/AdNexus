import 'server-only'
import { asc, count, eq, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { advertisers, contracts, users } from '@/db/schema'
import { requireRole } from '@/lib/auth'

export type AdvertiserRow = typeof advertisers.$inferSelect & {
  contractsCount: number
  /** Логины учётных записей бренда — доступ в кабинет. */
  logins: string[]
}

/** Рекламодатели для площадки: admin и viewer. */
export async function listAdvertisers(): Promise<AdvertiserRow[]> {
  await requireRole(['admin', 'viewer'])
  const db = getDb()
  const [rows, accounts] = await Promise.all([
    db
      .select({ advertiser: advertisers, contractsCount: count(contracts.id) })
      .from(advertisers)
      .leftJoin(contracts, eq(contracts.advertiserId, advertisers.id))
      .groupBy(advertisers.id)
      .orderBy(asc(advertisers.name)),
    db
      .select({ advertiserId: users.advertiserId, login: users.login })
      .from(users)
      .where(sql`${users.advertiserId} is not null`)
      .orderBy(asc(users.login)),
  ])
  return rows.map((r) => ({
    ...r.advertiser,
    contractsCount: r.contractsCount,
    logins: accounts
      .filter((a) => a.advertiserId === r.advertiser.id)
      .map((a) => a.login),
  }))
}

/** Короткий список для выбора в формах. Рекламодателю — только его бренд. */
export async function advertiserOptions() {
  const user = await requireRole(['admin', 'viewer', 'advertiser'])
  const query = getDb()
    .select({
      id: advertisers.id,
      name: advertisers.name,
      legalName: advertisers.legalName,
    })
    .from(advertisers)
    .orderBy(asc(advertisers.name))
  if (user.role !== 'advertiser') return query
  if (!user.advertiserId) return []
  return query.where(eq(advertisers.id, user.advertiserId))
}
