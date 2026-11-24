import { getCurrentUser } from '@/lib/auth'
import { advertiserOptions } from '@/lib/data/advertisers'
import { contractOptions } from '@/lib/data/contracts'
import { factsForReport } from '@/lib/data/facts'
import { formatMoment } from '@/lib/dates'
import { VERDICT } from '@/lib/facts'
import { parseFactsQuery } from '@/lib/factsQuery'
import { buildFactsReport } from '@/lib/factsReport'
import { isStaffRole } from '@/lib/roles'
import { MONTHS } from '@/lib/week'

/** Отчёт по стыковке в Excel — по тем же фильтрам, что на странице. */
export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return new Response('Нужен вход', { status: 401 })
  if (!isStaffRole(user.role)) {
    return new Response('Нет доступа', { status: 403 })
  }

  const params = new URL(request.url).searchParams
  const { period, verdict, advertiserId, contractId } = parseFactsQuery(
    (key) => params.get(key) ?? '',
  )
  const [{ rows, totals }, advertisers, contracts] = await Promise.all([
    factsForReport({
      month: period === 'all' ? undefined : period,
      verdict,
      advertiserId: advertiserId || undefined,
      contractId: contractId || undefined,
    }),
    advertiserOptions(),
    contractOptions(),
  ])

  const brand = advertisers.find((a) => a.id === advertiserId)?.name
  const contract = contracts.find((c) => c.id === contractId)?.number
  const periodLabel =
    period === 'all'
      ? 'всё время'
      : `${MONTHS[Number(period.slice(5)) - 1].toLowerCase()} ${period.slice(0, 4)}`

  const file = await buildFactsReport({
    rows,
    totals,
    subtitle: [
      `Период: ${periodLabel}`,
      [
        brand ? `Рекламодатель: ${brand}` : 'Все рекламодатели',
        contract && `Договор № ${contract}`,
        verdict && `Итог: ${VERDICT[verdict].many.toLowerCase()}`,
      ]
        .filter(Boolean)
        .join(' · '),
      `Сформирован: ${formatMoment(new Date())} по Ташкенту`,
    ],
  })

  const name = [
    'Стыковка',
    periodLabel,
    brand,
    contract && `договор ${contract}`,
  ]
    .filter(Boolean)
    .join(', ')
    // Знаки, с которыми Windows не сохранит файл.
    .replace(/[\\/:*?"<>|\r\n]+/g, '-')
    .slice(0, 150)
  return new Response(new Uint8Array(file), {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="report.xlsx"; filename*=UTF-8''${encodeURIComponent(`${name}.xlsx`)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
