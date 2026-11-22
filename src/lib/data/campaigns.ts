import 'server-only'
import { desc, eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { advertisers, campaigns, contracts } from '@/db/schema'
import { requireRole } from '@/lib/auth'

/**
 * Кампании для площадки. Рекламодателю пока пусто: учётные записи ещё
 * не привязаны к бренду, а чужие кампании ему показывать нельзя.
 */
export async function listCampaigns() {
  const user = await requireRole(['admin', 'viewer', 'advertiser'])
  if (user.role === 'advertiser') return []
  return getDb()
    .select({
      campaign: campaigns,
      advertiserName: advertisers.name,
      contractNumber: contracts.number,
    })
    .from(campaigns)
    .innerJoin(advertisers, eq(advertisers.id, campaigns.advertiserId))
    .innerJoin(contracts, eq(contracts.id, campaigns.contractId))
    .orderBy(desc(campaigns.createdAt))
}
