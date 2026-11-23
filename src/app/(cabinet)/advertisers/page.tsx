import type { Metadata } from 'next'
import { Building2 } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import {
  AdvertiserAccount,
  NewAdvertiserAccess,
} from '@/components/forms/AdvertiserAccess'
import { EditAdvertiser, NewAdvertiser } from '@/components/forms/NewAdvertiser'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SubTabs } from '@/components/ui/SubTabs'
import { Table, Td, Th, Tr } from '@/components/ui/Table'
import { requireSection } from '@/lib/auth'
import { listAdvertisers } from '@/lib/data/advertisers'
import { formatMoment } from '@/lib/dates'
import { ADVERTISER_STATUS } from '@/lib/advertisers'
import { fileHref } from '@/lib/files'
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
              {canCreate && <Th>Действия</Th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <Tr key={a.id}>
                <Td>
                  <span className="flex items-center gap-3">
                    <Avatar
                      name={a.name}
                      color={a.color}
                      src={a.logo ? fileHref(a.logo) : null}
                    />
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink">
                        {a.name}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-1.5">
                        <Badge tone={ADVERTISER_STATUS[a.status].tone} dot>
                          {ADVERTISER_STATUS[a.status].label}
                        </Badge>
                        {a.creativeRequired && (
                          <Badge tone="warning">Ролик обязателен</Badge>
                        )}
                      </span>
                    </span>
                  </span>
                </Td>
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
                    {a.accounts.map((account) => (
                      <AdvertiserAccount
                        key={account.id}
                        account={account}
                        advertiserName={a.name}
                        canEdit={canCreate}
                      />
                    ))}
                    {canCreate && (
                      <NewAdvertiserAccess
                        advertiserId={a.id}
                        advertiserName={a.name}
                      />
                    )}
                    {!canCreate && a.accounts.length === 0 && '—'}
                  </div>
                </Td>
                <Td className="tnum">{formatMoment(a.createdAt)}</Td>
                {canCreate && (
                  <Td>
                    <EditAdvertiser
                      advertiser={{
                        id: a.id,
                        name: a.name,
                        legalName: a.legalName,
                        contact: a.contact,
                        email: a.email,
                        status: a.status,
                        creativeRequired: a.creativeRequired,
                        requisites: a.requisites,
                        color: a.color,
                        logo: a.logo,
                      }}
                    />
                  </Td>
                )}
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  )
}
