import 'server-only'
import { asc, desc, eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { advertisers, contracts } from '@/db/schema'
import { requireRole } from '@/lib/auth'

export async function listContracts() {
  await requireRole(['admin', 'viewer'])
  return getDb()
    .select({ contract: contracts, advertiserName: advertisers.name })
    .from(contracts)
    .innerJoin(advertisers, eq(advertisers.id, contracts.advertiserId))
    .orderBy(desc(contracts.createdAt))
}

/**
 * Договоры для форм заказа и брони: из договора подставляются номер,
 * кампания, скидка, срок и файл. Рекламодателю — только договоры его бренда.
 */
export async function contractOptions() {
  const user = await requireRole(['admin', 'viewer', 'advertiser'])
  if (user.role === 'advertiser' && !user.advertiserId) return []
  const query = getDb()
    .select({
      id: contracts.id,
      advertiserId: contracts.advertiserId,
      number: contracts.number,
      campaignName: contracts.campaignName,
      startDate: contracts.startDate,
      endDate: contracts.endDate,
      status: contracts.status,
      discount: contracts.discount,
      file: contracts.file,
    })
    .from(contracts)
    .orderBy(asc(contracts.number))
  return user.role === 'advertiser' && user.advertiserId
    ? query.where(eq(contracts.advertiserId, user.advertiserId))
    : query
}

export type ContractOption = Awaited<ReturnType<typeof contractOptions>>[number]
