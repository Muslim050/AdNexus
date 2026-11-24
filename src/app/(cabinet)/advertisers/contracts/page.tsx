import { Suspense } from 'react'
import type { Metadata } from 'next'
import { FileText } from 'lucide-react'
import { ContractsView } from '@/components/advertisers/ContractsView'
import { PageHeader } from '@/components/PageHeader'
import { NewContract } from '@/components/forms/NewContract'
import { EmptyState } from '@/components/ui/EmptyState'
import { ViewSwitch } from '@/components/ui/ListOrGrid'
import { Loader } from '@/components/ui/Loader'
import { SubTabs } from '@/components/ui/SubTabs'
import { requireSection } from '@/lib/auth'
import { advertiserOptions } from '@/lib/data/advertisers'
import { listContracts } from '@/lib/data/contracts'
import { ADVERTISER_TABS } from '../tabs'
import { isEditor } from '@/lib/roles'

export const metadata: Metadata = { title: 'Договоры' }

export default function Page() {
  return (
    <>
      <PageHeader
        title="Рекламодатели и бренды"
        subtitle="Договоры брендов: номер, срок, сроки оплаты и статус."
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
        <Contracts />
      </Suspense>
    </>
  )
}

async function load() {
  const user = await requireSection('/advertisers')
  const canCreate = isEditor(user.role)
  const [rows, advertisers] = await Promise.all([
    listContracts(),
    canCreate ? advertiserOptions() : Promise.resolve([]),
  ])
  const create = canCreate && (
    // С отключённым брендом новый договор не заводим.
    <NewContract
      advertisers={advertisers.filter((a) => a.status === 'active')}
    />
  )
  return { rows, advertisers, canCreate, create }
}

async function View() {
  const { rows } = await load()
  if (rows.length === 0) return null
  return (
    <ViewSwitch
      storageKey="contracts-grid"
      caption={`Договоров: ${rows.length}`}
    />
  )
}

async function CreateAction() {
  const { rows, create } = await load()
  return rows.length > 0 && create
}

async function Contracts() {
  const { rows, advertisers, canCreate, create } = await load()

  return (
    <>
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
        <ContractsView rows={rows} />
      )}
    </>
  )
}
