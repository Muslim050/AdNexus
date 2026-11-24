import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Building2 } from 'lucide-react'
import { AdvertisersView } from '@/components/advertisers/AdvertisersView'
import { NewAdvertiser } from '@/components/forms/NewAdvertiser'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { ViewSwitch } from '@/components/ui/ListOrGrid'
import { Loader } from '@/components/ui/Loader'
import { SubTabs } from '@/components/ui/SubTabs'
import { requireSection } from '@/lib/auth'
import { listAdvertisers } from '@/lib/data/advertisers'
import { listContracts } from '@/lib/data/contracts'
import { ADVERTISER_TABS } from './tabs'
import { isEditor } from '@/lib/roles'

export const metadata: Metadata = { title: 'Рекламодатели и бренды' }

export default function Page() {
  return (
    <>
      <PageHeader
        title="Рекламодатели и бренды"
        subtitle="Бренды, с которыми заключаются договоры."
      >
        <Suspense>
          <CreateAction />
        </Suspense>
      </PageHeader>
      <SubTabs tabs={ADVERTISER_TABS}>
        <Suspense>
          <View />
        </Suspense>
      </SubTabs>
      <Suspense fallback={<Loader />}>
        <Advertisers />
      </Suspense>
    </>
  )
}

async function load() {
  const user = await requireSection('/advertisers')
  return { rows: await listAdvertisers(), canCreate: isEditor(user.role) }
}

async function View() {
  const { rows } = await load()
  if (rows.length === 0) return null
  return (
    <ViewSwitch
      storageKey="advertisers-grid"
      caption={`Брендов: ${rows.length}`}
    />
  )
}

async function CreateAction() {
  const { rows, canCreate } = await load()
  return canCreate && rows.length > 0 && <NewAdvertiser />
}

async function Advertisers() {
  const [{ rows, canCreate }, contracts] = await Promise.all([
    load(),
    listContracts(),
  ])

  return (
    <>
      {rows.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Рекламодателей пока нет"
          description="Добавьте бренд — затем ему можно заключить договор и создать кампанию."
          action={canCreate && <NewAdvertiser />}
        />
      ) : (
        <AdvertisersView
          rows={rows}
          contracts={contracts.map(({ contract: c }) => ({
            id: c.id,
            advertiserId: c.advertiserId,
            number: c.number,
            campaignName: c.campaignName,
            startDate: c.startDate,
            endDate: c.endDate,
            status: c.status,
            discount: c.discount,
            file: c.file,
          }))}
          canEdit={canCreate}
        />
      )}
    </>
  )
}
