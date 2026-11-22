import 'server-only'
import { desc, eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { advertisers, campaigns, contracts } from '@/db/schema'
import { requireRole } from '@/lib/auth'

/** Заказы: площадке — все, рекламодателю — только его бренда. */
export async function listCampaigns() {
  const user = await requireRole(['admin', 'viewer', 'advertiser'])
  if (user.role === 'advertiser' && !user.advertiserId) return []
  const query = getDb()
    .select({
      campaign: campaigns,
      advertiserName: advertisers.name,
      contractNumber: contracts.number,
    })
    .from(campaigns)
    .innerJoin(advertisers, eq(advertisers.id, campaigns.advertiserId))
    .innerJoin(contracts, eq(contracts.id, campaigns.contractId))
    .orderBy(desc(campaigns.createdAt))
  // Рекламодателю — только заказы его бренда.
  return user.role === 'advertiser' && user.advertiserId
    ? query.where(eq(campaigns.advertiserId, user.advertiserId))
    : query
}
