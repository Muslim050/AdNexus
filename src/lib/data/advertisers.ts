import 'server-only'
import { cache } from 'react'
import { asc, count, eq, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { advertisers, contracts, users } from '@/db/schema'
import { requireRole } from '@/lib/auth'
import { ROLES, STAFF } from '@/lib/roles'

export interface AdvertiserAccount {
  id: string
  login: string
  firstName: string
  lastName: string
  email: string
  phone: string
  isActive: boolean
}

export type AdvertiserRow = typeof advertisers.$inferSelect & {
  contractsCount: number
  /** Учётные записи бренда — доступ в кабинет. */
  accounts: AdvertiserAccount[]
}

/** Рекламодатели для площадки: admin и viewer. Один запрос на рендер. */
export const listAdvertisers = cache(async (): Promise<AdvertiserRow[]> => {
  await requireRole(STAFF)
  const db = getDb()
  const [rows, accounts] = await Promise.all([
    db
      .select({ advertiser: advertisers, contractsCount: count(contracts.id) })
      .from(advertisers)
      .leftJoin(contracts, eq(contracts.advertiserId, advertisers.id))
      .groupBy(advertisers.id)
      .orderBy(asc(advertisers.name)),
    db
      .select({
        advertiserId: users.advertiserId,
        id: users.id,
        login: users.login,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        isActive: users.isActive,
      })
      .from(users)
      .where(sql`${users.advertiserId} is not null`)
      .orderBy(asc(users.login)),
  ])
  return rows.map((r) => ({
    ...r.advertiser,
    contractsCount: r.contractsCount,
    accounts: accounts
      .filter((a) => a.advertiserId === r.advertiser.id)
      .map(({ id, login, firstName, lastName, email, phone, isActive }) => ({
        id,
        login,
        firstName,
        lastName,
        email,
        phone,
        isActive,
      })),
  }))
})

/** Короткий список для выбора в формах. Рекламодателю — только его бренд. */
export const advertiserOptions = cache(async () => {
  const user = await requireRole(ROLES)
  const query = getDb()
    .select({
      id: advertisers.id,
      name: advertisers.name,
      legalName: advertisers.legalName,
      status: advertisers.status,
      creativeRequired: advertisers.creativeRequired,
    })
    .from(advertisers)
    .orderBy(asc(advertisers.name))
  if (user.role !== 'advertiser') return query
  if (!user.advertiserId) return []
  return query.where(eq(advertisers.id, user.advertiserId))
})
