'use client'

import { useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  CircleCheck,
  CircleX,
  Clock,
  Download,
  ExternalLink,
  Eye,
  GitCompareArrows,
  TriangleAlert,
} from 'lucide-react'
import { Kpi } from '@/components/orders/Kpi'
import { Pager } from '@/components/orders/Pager'
import { PeriodTabs } from '@/components/orders/PeriodTabs'
import { shortDay } from '@/components/orders/shortDay'
import { Badge } from '@/components/ui/Badge'
import { BrandAvatar } from '@/components/ui/BrandAvatar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SelectField } from '@/components/ui/SelectField'
import { cn } from '@/lib/cn'
import type { FactRow } from '@/lib/data/facts'
import { formatMoment } from '@/lib/dates'
import { VERDICT, VERDICTS, type Verdict } from '@/lib/facts'
import { longDay } from '@/lib/week'
import { FactBlock } from './FactBlock'

const num = (n: number) => n.toLocaleString('ru-RU')

interface Props {
  rows: FactRow[]
  total: number
  all: number
  page: number
  pageSize: number
  counts: Record<Verdict, number>
  impressions: { plan: number; fact: number }
  olderWaiting: number
  query: {
    period: string
    verdict: Verdict | ''
    advertiserId: string
    contractId: string
  }
  currentMonth: string
  advertisers: { id: string; name: string }[]
  contracts: { id: string; advertiserId: string; number: string }[]
  canEdit: boolean
}

/** «Стыковка публикаций»: вышедшие публикации, план рядом с фактом и итог. */
export function FactsView({
  rows,
  total,
  all,
  page,
  pageSize,
  counts,
  impressions,
  olderWaiting,
  query,
  currentMonth,
  advertisers,
  contracts,
  canEdit,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, start] = useTransition()
  const [openId, setOpenId] = useState<string | null>(null)
  const [withForm, setWithForm] = useState(false)
  // Открытую строку держим: после сохранения она может уйти из-под фильтра.
  const [last, setLast] = useState<FactRow | null>(null)
  const fresh = rows.find((r) => r.id === openId) ?? null
  if (fresh && fresh !== last) setLast(fresh)
  const opened = openId ? (fresh ?? last) : last

  function go(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k)
      else next.set(k, v)
    }
    if (!('page' in patch)) next.delete('page')
    const qs = next.toString()
    start(() =>
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }),
    )
  }

  const open = (row: FactRow, form: boolean) => {
    setLast(row)
    setWithForm(form)
    setOpenId(row.id)
  }

  const brandContracts = contracts.filter(
    (c) => !query.advertiserId || c.advertiserId === query.advertiserId,
  )

  return (
    <div className={cn('transition-opacity', pending && 'opacity-60')}>
      <PeriodTabs
        period={query.period}
        currentMonth={currentMonth}
        onPick={(period) =>
          go({ month: period === currentMonth ? null : period })
        }
      />

      {olderWaiting > 0 && (
        <p className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 border border-warning/30 bg-warning/8 px-4 py-2.5 text-sm text-ink">
          В прошлых месяцах ожидают стыковки: {olderWaiting}
          <button
            type="button"
            onClick={() => go({ month: 'all', verdict: 'waiting' })}
            className="font-semibold text-indigo-600 underline-offset-2 hover:underline focus-ring"
          >
            Показать
          </button>
        </p>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          icon={Clock}
          label={VERDICT.waiting.many}
          value={String(counts.waiting)}
          note={`из ${all} по плану`}
          alert={counts.waiting > 0}
        />
        <Kpi
          icon={CircleCheck}
          label={VERDICT.matched.many}
          value={String(counts.matched)}
          note="вышли вовремя и набрали показы"
        />
        <Kpi
          icon={counts.mismatch ? TriangleAlert : CircleX}
          label="Расхождения"
          value={String(counts.mismatch + counts.missed)}
          note={`из них не вышло: ${counts.missed}`}
          alert={counts.mismatch + counts.missed > 0}
        />
        <Kpi
          icon={Eye}
          label="Показы по факту"
          value={num(impressions.fact)}
          note={`по плану ${num(impressions.plan)}`}
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="no-scrollbar -mx-5 flex gap-1 overflow-x-auto border-b border-line px-5 sm:mx-0 sm:px-0">
          {(['', ...VERDICTS] as const).map((v) => {
            const on = query.verdict === v
            return (
              <button
                key={v || 'all'}
                type="button"
                aria-pressed={on}
                onClick={() => go({ verdict: v || null })}
                className={cn(
                  'relative flex shrink-0 items-center gap-2 px-3 pb-3 pt-1 text-[13.5px] font-semibold transition-colors focus-ring',
                  on ? 'text-ink' : 'text-ink-muted hover:text-ink',
                )}
              >
                {v ? VERDICT[v].many : 'Все'}
                <span
                  className={cn(
                    'min-w-5 px-1.5 py-px text-center font-mono text-[11px] tnum',
                    on ? 'bg-forest text-white' : 'bg-ink/6 text-ink-soft',
                  )}
                >
                  {v ? counts[v] : all}
                </span>
                <span
                  className={cn(
                    'absolute inset-x-2 -bottom-px h-[3px] bg-indigo-500',
                    on ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </button>
            )
          })}
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] lg:w-[560px]">
          <SelectField
            name="brandFilter"
            value={query.advertiserId || 'all'}
            onChange={(v) =>
              go({ brand: v === 'all' ? null : v, contract: null })
            }
            options={[
              { value: 'all', label: 'Все бренды' },
              ...advertisers.map((a) => ({ value: a.id, label: a.name })),
            ]}
          />
          <SelectField
            name="contractFilter"
            value={query.contractId || 'all'}
            onChange={(v) => go({ contract: v === 'all' ? null : v })}
            options={[
              { value: 'all', label: 'Все договоры' },
              ...brandContracts.map((c) => ({
                value: c.id,
                label: `№ ${c.number}`,
              })),
            ]}
          />
          {/* Обычная ссылка: файл скачивается с теми же фильтрами. */}
          <a
            href={`/api/facts/export?${params.toString()}`}
            download
            title="Скачать отчёт по этим фильтрам"
            className="flex h-11 items-center justify-center gap-2 border border-ink/20 bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:border-ink focus-ring"
          >
            <Download size={16} aria-hidden="true" />
            Excel
          </a>
        </div>
      </div>

      {/* relative — иначе sr-only подпись в шапке растягивает страницу. */}
      <div className="relative overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead>
            <tr>
              {['№', 'Публикация', 'План', 'Факт', 'Показы', 'Итог', ''].map(
                (h, i) => (
                  <th
                    key={h || 'action'}
                    className={cn(
                      'eyebrow border-b border-line bg-paper/60 px-3 py-3 text-left font-semibold text-ink-muted',
                      i === 0 && 'pl-5',
                      h === '' && 'pr-5',
                    )}
                  >
                    {h || <span className="sr-only">Действие</span>}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <Row
                key={r.id}
                index={(page - 1) * pageSize + i + 1}
                row={r}
                canEdit={canEdit}
                onOpen={(form) => open(r, form)}
              />
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="bg-hatch py-14 text-center text-ink-muted"
                >
                  {all === 0
                    ? 'За этот период публикаций с прошедшим временем нет.'
                    : 'С таким итогом или фильтром публикаций нет.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pager
        page={page}
        pageSize={pageSize}
        total={total}
        onPage={(n) => go({ page: String(n) })}
      />

      <Modal
        open={openId != null}
        onClose={() => setOpenId(null)}
        size="sm"
        wide
        icon={GitCompareArrows}
        title={opened ? opened.campaignName || opened.formatName : ''}
        description={
          opened
            ? [
                opened.advertiserName,
                opened.formatName,
                `${longDay(opened.date)}, ${opened.time}`,
              ]
                .filter(Boolean)
                .join(' · ')
            : undefined
        }
      >
        {opened && (
          <FactBlock
            key={`${opened.id}-${withForm}`}
            slot={opened}
            canEdit={canEdit}
            startOpen={withForm}
          />
        )}
      </Modal>
    </div>
  )
}

function Row({
  index,
  row: r,
  canEdit,
  onOpen,
}: {
  index: number
  row: FactRow
  canEdit: boolean
  onOpen: (form: boolean) => void
}) {
  const published = r.fact?.outcome === 'published'
  const plan = r.fact?.planImpressions ?? r.planImpressions
  return (
    <tr
      onClick={(e) => {
        if (!(e.target as Element).closest('button, a')) onOpen(false)
      }}
      className="cursor-pointer border-b border-line transition-colors last:border-b-0 hover:bg-indigo-50/40"
    >
      <td className="whitespace-nowrap py-3 pl-5 pr-2 font-mono text-xs text-ink-muted tnum">
        {index}
      </td>
      <td className="max-w-[260px] px-3 py-3">
        <span className="flex items-center gap-3">
          {r.advertiserName ? (
            <BrandAvatar
              name={r.advertiserName}
              logo={r.advertiserLogo}
              color={r.advertiserColor}
            />
          ) : (
            <span
              aria-hidden="true"
              className="h-10 w-10 shrink-0 border border-dashed border-ink/20"
            />
          )}
          <span className="min-w-0">
            <button
              type="button"
              onClick={() => onOpen(false)}
              className="block max-w-full truncate text-left font-semibold text-ink underline-offset-2 hover:underline focus-ring"
            >
              {r.advertiserName ?? 'Без рекламодателя'}
            </button>
            <span className="block truncate text-xs text-ink-muted">
              {r.campaignName || '—'}
            </span>
          </span>
        </span>
      </td>
      <td className="whitespace-nowrap px-3 py-3">
        <span className="block font-semibold text-ink tnum">
          {shortDay(r.date)} · {r.time}
        </span>
        <span className="mt-0.5 flex items-center gap-2 text-xs text-ink-muted">
          <span
            className="h-2.5 w-2.5 shrink-0"
            style={{ background: r.color }}
          />
          {r.formatName}
        </span>
      </td>
      <td className="whitespace-nowrap px-3 py-3 tnum">
        {published && r.fact?.publishedAt ? (
          <>
            <span className="block font-semibold text-ink">
              {formatMoment(r.fact.publishedAt)}
            </span>
            {r.fact.link && (
              <a
                href={r.fact.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 flex w-fit items-center gap-1 text-xs font-semibold text-indigo-600 underline-offset-2 hover:underline focus-ring"
              >
                <ExternalLink size={12} aria-hidden="true" />
                Открыть публикацию
              </a>
            )}
          </>
        ) : (
          <span className="text-ink-muted">—</span>
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-3 tnum">
        <span className="block font-semibold text-ink">
          {published && r.fact?.impressions != null
            ? num(r.fact.impressions)
            : '—'}
        </span>
        {plan > 0 && (
          <span className="text-xs text-ink-muted">план {num(plan)}</span>
        )}
      </td>
      <td className="max-w-[240px] px-3 py-3">
        <Badge tone={VERDICT[r.verdict].tone} dot>
          {VERDICT[r.verdict].label}
        </Badge>
        {r.notes.map((note) => (
          <span
            key={note}
            className="mt-1 line-clamp-2 block text-xs text-ink-muted"
          >
            {note}
          </span>
        ))}
      </td>
      <td className="whitespace-nowrap py-3 pl-3 pr-5 text-right">
        {canEdit && !r.fact && (
          <Button size="sm" variant="secondary" onClick={() => onOpen(true)}>
            Внести факт
          </Button>
        )}
      </td>
    </tr>
  )
}
