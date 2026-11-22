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

/** Договоры для формы кампании: из договора подставляются название и срок. */
export async function contractOptions() {
  await requireRole(['admin', 'viewer'])
  return getDb()
    .select({
      id: contracts.id,
      advertiserId: contracts.advertiserId,
      number: contracts.number,
      campaignName: contracts.campaignName,
      startDate: contracts.startDate,
      endDate: contracts.endDate,
      status: contracts.status,
    })
    .from(contracts)
    .orderBy(asc(contracts.number))
}

export type ContractOption = Awaited<ReturnType<typeof contractOptions>>[number]
