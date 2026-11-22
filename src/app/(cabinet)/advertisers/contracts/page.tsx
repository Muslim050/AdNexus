import type { Metadata } from 'next'
import { FileText } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { NewContract } from '@/components/forms/NewContract'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SubTabs } from '@/components/ui/SubTabs'
import { Table, Td, Th, Tr } from '@/components/ui/Table'
import { requireSection } from '@/lib/auth'
import { CONTRACT_STATUS } from '@/lib/contracts'
import { advertiserOptions } from '@/lib/data/advertisers'
import { listContracts } from '@/lib/data/contracts'
import { formatDay, formatPeriod } from '@/lib/dates'
import { ADVERTISER_TABS } from '../tabs'

export const metadata: Metadata = { title: 'Договоры' }

export default async function Page() {
  const user = await requireSection('/advertisers')
  const canCreate = user.role === 'admin'
  const [rows, advertisers] = await Promise.all([
    listContracts(),
    canCreate ? advertiserOptions() : Promise.resolve([]),
  ])
  const create = canCreate && <NewContract advertisers={advertisers} />

  return (
    <>
      <PageHeader
        title="Рекламодатели и бренды"
        subtitle="Договоры брендов: номер, срок, сроки оплаты и статус."
      >
        {rows.length > 0 && create}
      </PageHeader>
      <SubTabs tabs={ADVERTISER_TABS} />

      {rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Договоров пока нет"
          description={
            canCreate && advertisers.length === 0
              ? 'Сначала добавьте рекламодателя на соседней вкладке.'
              : 'Договор заключается с рекламодателем — из него создаются кампании.'
          }
          action={create}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>№ договора</Th>
              <Th>Рекламодатель</Th>
              <Th>Рекламная кампания</Th>
              <Th>Срок</Th>
              <Th>Оплата до</Th>
              <Th>Статус</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ contract: c, advertiserName }) => (
              <Tr key={c.id}>
                <Td className="font-mono text-[13px] font-semibold text-ink">
                  {c.number}
                </Td>
                <Td className="text-ink">{advertiserName}</Td>
                <Td>{c.campaignName || '—'}</Td>
                <Td className="tnum">{formatPeriod(c.startDate, c.endDate)}</Td>
                <Td className="tnum">{formatDay(c.paymentDate)}</Td>
                <Td>
                  <Badge tone={CONTRACT_STATUS[c.status].tone} dot>
                    {CONTRACT_STATUS[c.status].label}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  )
}
