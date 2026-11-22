import type { Metadata } from 'next'
import { Building2 } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { NewAdvertiser } from '@/components/forms/NewAdvertiser'
import { NewAdvertiserAccess } from '@/components/forms/NewAdvertiserAccess'
import { EmptyState } from '@/components/ui/EmptyState'
import { SubTabs } from '@/components/ui/SubTabs'
import { Table, Td, Th, Tr } from '@/components/ui/Table'
import { requireSection } from '@/lib/auth'
import { listAdvertisers } from '@/lib/data/advertisers'
import { formatMoment } from '@/lib/dates'
import { ADVERTISER_TABS } from './tabs'

export const metadata: Metadata = { title: 'Рекламодатели и бренды' }

export default async function Page() {
  const user = await requireSection('/advertisers')
  const rows = await listAdvertisers()
  const canCreate = user.role === 'admin'

  return (
    <>
      <PageHeader
        title="Рекламодатели и бренды"
        subtitle="Бренды, с которыми заключаются договоры."
      >
        {canCreate && rows.length > 0 && <NewAdvertiser />}
      </PageHeader>
      <SubTabs tabs={ADVERTISER_TABS} />

      {rows.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Рекламодателей пока нет"
          description="Добавьте бренд — затем ему можно заключить договор и создать кампанию."
          action={canCreate && <NewAdvertiser />}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Бренд</Th>
              <Th>Юр. лицо</Th>
              <Th>Контакт</Th>
              <Th className="text-right">Договоров</Th>
              <Th>Доступ в кабинет</Th>
              <Th>Добавлен</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <Tr key={a.id}>
                <Td className="font-semibold text-ink">{a.name}</Td>
                <Td>{a.legalName || '—'}</Td>
                <Td>
                  {a.contact || '—'}
                  {a.email && (
                    <span className="block text-xs text-ink-muted">
                      {a.email}
                    </span>
                  )}
                </Td>
                <Td className="text-right tnum">{a.contractsCount}</Td>
                <Td>
                  <div className="flex flex-wrap items-center gap-2">
                    {a.logins.map((login) => (
                      <span
                        key={login}
                        className="border border-line bg-paper px-2 py-0.5 font-mono text-[12px] text-ink"
                      >
                        {login}
                      </span>
                    ))}
                    {canCreate && (
                      <NewAdvertiserAccess
                        advertiserId={a.id}
                        advertiserName={a.name}
                        contact={a.contact}
                      />
                    )}
                    {!canCreate && a.logins.length === 0 && '—'}
                  </div>
                </Td>
                <Td className="tnum">{formatMoment(a.createdAt)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  )
}
