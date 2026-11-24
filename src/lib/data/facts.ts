import 'server-only'
import { and, desc, eq, sql, type SQL } from 'drizzle-orm'
import { bookings } from '@/db/schema'
import { requireRole } from '@/lib/auth'
import { VERDICTS, checkFact, type Verdict } from '@/lib/facts'
import { STAFF } from '@/lib/roles'
import { bookingsQuery, withPayments } from './bookings'

export interface FactsQuery {
  /** 'YYYY-MM' или undefined — за всё время. */
  month?: string
  verdict?: Verdict
  advertiserId?: string
  contractId?: string
  page: number
}

export const FACTS_PAGE_SIZE = 20
/** Больше за раз не сверяем: столько публикаций — это годы работы. */
const MAX_ROWS = 3000

const planned = sql`((${bookings.date} + ${bookings.time}::time) at time zone 'Asia/Tashkent')`

/**
 * Публикации, у которых прошло время по плану, с итогом стыковки. Итог
 * считает checkFact — одна логика для списка, карточки, отчёта и сохранения.
 */
async function loadFacts({
  month,
  verdict,
  advertiserId,
  contractId,
}: Omit<FactsQuery, 'page'>) {
  await requireRole(STAFF)
  const scope: SQL[] = [sql`${planned} <= now()`]
  if (advertiserId) scope.push(eq(bookings.advertiserId, advertiserId))
  if (contractId) scope.push(eq(bookings.contractId, contractId))

  const all = await bookingsQuery(and(...scope))
    .orderBy(desc(bookings.date), desc(bookings.time), desc(bookings.id))
    .limit(MAX_ROWS)
  const checked = all.map((row) => ({ ...row, ...checkFact(row, row.fact) }))
  const inPeriod = month
    ? checked.filter((r) => r.date.startsWith(month))
    : checked
  return {
    inPeriod,
    found: verdict ? inPeriod.filter((r) => r.verdict === verdict) : inPeriod,
    // Чтобы о прошлых месяцах не забыли, когда открыт текущий.
    olderWaiting: month
      ? checked.filter((r) => r.verdict === 'waiting' && r.date < `${month}-01`)
          .length
      : 0,
  }
}

export type CheckedBooking = Awaited<
  ReturnType<typeof loadFacts>
>['found'][number]

export interface FactsTotals {
  counts: Record<Verdict, number>
  impressions: { plan: number; fact: number }
}

function totalsOf(rows: CheckedBooking[]): FactsTotals {
  const counts = Object.fromEntries(VERDICTS.map((v) => [v, 0])) as Record<
    Verdict,
    number
  >
  const impressions = { plan: 0, fact: 0 }
  for (const r of rows) {
    counts[r.verdict]++
    impressions.plan += r.fact?.planImpressions ?? r.planImpressions
    impressions.fact += r.fact?.impressions ?? 0
  }
  return { counts, impressions }
}

/** Страница списка; итоги — за период, без фильтра по итогу. */
export async function listFacts({ page, ...query }: FactsQuery) {
  const { inPeriod, found, olderWaiting } = await loadFacts(query)
  const start = (page - 1) * FACTS_PAGE_SIZE
  return {
    rows: await withPayments(found.slice(start, start + FACTS_PAGE_SIZE)),
    total: found.length,
    all: inPeriod.length,
    ...totalsOf(inPeriod),
    olderWaiting,
  }
}

/** Всё под фильтры и итоги по ним — для отчёта; по порядку выхода. */
export async function factsForReport(query: Omit<FactsQuery, 'page'>) {
  const { found } = await loadFacts(query)
  return { rows: found.toReversed(), totals: totalsOf(found) }
}

export type FactRow = Awaited<ReturnType<typeof listFacts>>['rows'][number]
