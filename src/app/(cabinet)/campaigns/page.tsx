import type { Metadata } from 'next'
import { Megaphone } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { NewCampaign } from '@/components/forms/NewCampaign'
import { EmptyState } from '@/components/ui/EmptyState'
import { Table, Td, Th, Tr } from '@/components/ui/Table'
import { requireSection } from '@/lib/auth'
import { advertiserOptions } from '@/lib/data/advertisers'
import { listCampaigns } from '@/lib/data/campaigns'
import { contractOptions } from '@/lib/data/contracts'
import { formatMoment, formatPeriod } from '@/lib/dates'

export const metadata: Metadata = { title: 'Кампании' }

export default async function Page() {
  const user = await requireSection('/campaigns')
  const canCreate = user.role === 'admin'
  const [rows, advertisers, contracts] = await Promise.all([
    listCampaigns(),
    canCreate ? advertiserOptions() : Promise.resolve([]),
    canCreate ? contractOptions() : Promise.resolve([]),
  ])
  const create = canCreate && (
    <NewCampaign advertisers={advertisers} contracts={contracts} />
  )

  return (
    <>
      <PageHeader
        title="Кампании"
        subtitle="Рекламные кампании брендов, оформленные по договорам."
      >
        {rows.length > 0 && create}
      </PageHeader>

      {rows.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Кампаний пока нет"
          description={
            canCreate && contracts.length === 0
              ? 'Кампания создаётся по договору. Сначала добавьте рекламодателя и договор.'
              : 'Здесь появятся кампании брендов.'
          }
          action={create}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Кампания</Th>
              <Th>Рекламодатель</Th>
              <Th>№ договора</Th>
              <Th>Период</Th>
              <Th>Создана</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ campaign: c, advertiserName, contractNumber }) => (
              <Tr key={c.id}>
                <Td className="font-semibold text-ink">{c.name}</Td>
                <Td className="text-ink">{advertiserName}</Td>
                <Td className="font-mono text-[13px]">{contractNumber}</Td>
                <Td className="tnum">{formatPeriod(c.startDate, c.endDate)}</Td>
                <Td className="tnum">
                  {formatMoment(c.createdAt)}
                  <span className="block text-xs text-ink-muted">
                    {c.createdBy}
                  </span>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  )
}
