import { Suspense } from 'react'
import type { Metadata } from 'next'
import { FactsView } from '@/components/facts/FactsView'
import { PageHeader } from '@/components/PageHeader'
import { Loader } from '@/components/ui/Loader'
import { requireSection } from '@/lib/auth'
import { advertiserOptions } from '@/lib/data/advertisers'
import { contractOptions } from '@/lib/data/contracts'
import { FACTS_PAGE_SIZE, listFacts } from '@/lib/data/facts'
import { parseFactsQuery } from '@/lib/factsQuery'
import { isEditor } from '@/lib/roles'

export const metadata: Metadata = { title: 'Стыковка публикаций' }

/** Фильтры живут в адресе: ?month=2026-11&verdict=waiting&brand=…&contract=…&page=2 */
export default function Page({ searchParams }: PageProps<'/facts'>) {
  return (
    <>
      <PageHeader
        title="Стыковка публикаций"
        subtitle="План публикаций и что вышло на самом деле. Нажмите на строку, чтобы открыть сверку."
      />
      <Suspense fallback={<Loader />}>
        <Facts searchParams={searchParams} />
      </Suspense>
    </>
  )
}

async function Facts({
  searchParams,
}: Pick<PageProps<'/facts'>, 'searchParams'>) {
  const user = await requireSection('/facts')
  const sp = await searchParams
  const one = (k: string) => {
    const v = sp[k]
    return (Array.isArray(v) ? v[0] : v) ?? ''
  }

  const { currentMonth, period, verdict, advertiserId, contractId, page } =
    parseFactsQuery(one)

  const [list, advertisers, contracts] = await Promise.all([
    listFacts({
      month: period === 'all' ? undefined : period,
      verdict,
      advertiserId: advertiserId || undefined,
      contractId: contractId || undefined,
      page,
    }),
    advertiserOptions(),
    contractOptions(),
  ])

  return (
    <FactsView
      rows={list.rows}
      total={list.total}
      all={list.all}
      page={page}
      pageSize={FACTS_PAGE_SIZE}
      counts={list.counts}
      impressions={list.impressions}
      olderWaiting={list.olderWaiting}
      query={{ period, verdict: verdict ?? '', advertiserId, contractId }}
      currentMonth={currentMonth}
      advertisers={advertisers.map(({ id, name }) => ({ id, name }))}
      contracts={contracts.map(({ id, advertiserId, number }) => ({
        id,
        advertiserId,
        number,
      }))}
      canEdit={isEditor(user.role)}
    />
  )
}
