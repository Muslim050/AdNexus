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

export const metadata: Metadata = { title: 'Заказы и медиапланы' }

export default async function Page() {
  const user = await requireSection('/orders')
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
        title="Заказы и медиапланы"
        subtitle="Заказы брендов, оформленные по договорам."
      >
        {rows.length > 0 && create}
      </PageHeader>

      {rows.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Заказов пока нет"
          description={
            canCreate && contracts.length === 0
              ? 'Заказ оформляется по договору. Сначала добавьте рекламодателя и договор в разделе «Рекламодатели и бренды».'
              : 'Здесь появятся заказы брендов.'
          }
          action={create}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Заказ</Th>
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
