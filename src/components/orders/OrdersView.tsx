'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  CalendarDays,
  Coins,
  Hourglass,
  Pencil,
  Plus,
  Search,
  Wallet,
} from 'lucide-react'
import { createBooking, updateBooking } from '@/app/actions/bookings'
import {
  BookingFields,
  type AdvertiserChoice,
  type ContractChoice,
  type FormatChoice,
  type ManagerChoice,
} from '@/components/calendar/BookingFields'
import { PaymentsBlock } from '@/components/calendar/PaymentsBlock'
import { SlotDetails } from '@/components/calendar/SlotDetails'
import type { CalendarSlot } from '@/components/calendar/types'
import { FormDrawer } from '@/components/forms/CreateDrawer'
import { BrandAvatar } from '@/components/ui/BrandAvatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { SelectField } from '@/components/ui/SelectField'
import { BOOKING_STATUS } from '@/lib/bookings'
import { cn } from '@/lib/cn'
import { formatSum } from '@/lib/forms'
import { isEditor, type Role } from '@/lib/roles'
import { longDay } from '@/lib/week'
import type { OrdersFilter } from '@/lib/data/orders'
import { Kpi } from './Kpi'
import { Pager } from './Pager'
import { PeriodTabs } from './PeriodTabs'
import { shortDay } from './shortDay'

const FILTERS: { id: OrdersFilter; label: string }[] = [
  { id: 'upcoming', label: 'Предстоящие' },
  { id: 'sent', label: 'Отправлены' },
  { id: 'received', label: 'Получены' },
  { id: 'reviewing', label: 'Рассматриваются' },
  { id: 'active', label: 'Активны' },
  { id: 'completed', label: 'Выполнены' },
  { id: 'all', label: 'Все' },
]

const MONTHS_IN = [
  'январе',
  'феврале',
  'марте',
  'апреле',
  'мае',
  'июне',
  'июле',
  'августе',
  'сентябре',
  'октябре',
  'ноябре',
  'декабре',
]
const MONTHS_FOR = [
  'январь',
  'февраль',
  'март',
  'апрель',
  'май',
  'июнь',
  'июль',
  'август',
  'сентябрь',
  'октябрь',
  'ноябрь',
  'декабрь',
]

interface Props {
  rows: CalendarSlot[]
  total: number
  page: number
  pageSize: number
  counts: Record<OrdersFilter, number>
  query: { status: OrdersFilter; formatId: string; q: string; period: string }
  currentMonth: string
  today: string
  stats: { events: number; total: number; paid: number; remaining: number }
  formats: FormatChoice[]
  managers: ManagerChoice[]
  advertisers: AdvertiserChoice[]
  contracts: ContractChoice[]
  role: Role
  currentUserId: string
}

/**
 * «Заказы и медиапланы» — список публикаций по образцу броней yakasaroy:
 * период, итоги, вкладки статусов, поиск и формат, таблица с оплатой.
 */
export function OrdersView({
  rows,
  total,
  page,
  pageSize,
  counts,
  query,
  currentMonth,
  today,
  stats,
  formats,
  managers,
  advertisers,
  contracts,
  role,
  currentUserId,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, start] = useTransition()
  const [q, setQ] = useState(query.q)
  const [openId, setOpenId] = useState<string | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [create, setCreate] = useState({ open: false, round: 0 })
  const [editing, setEditing] = useState<{
    open: boolean
    slot: CalendarSlot | null
    round: number
  }>({
    open: false,
    slot: null,
    round: 0,
  })
  const skipSearch = useRef(false)

  const canBook = role === 'advertiser' || isEditor(role)
  const formRole = role === 'advertiser' ? 'advertiser' : 'staff'
  const opened = rows.find((r) => r.id === openId) ?? null
  const paying = rows.find((r) => r.id === payingId) ?? null

  function go(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k)
      else next.set(k, v)
    }
    if (!('page' in patch)) next.delete('page')
    start(() =>
      router.replace(`${pathname}?${next.toString()}`, { scroll: false }),
    )
  }

  // Поиск по мере ввода, с небольшой паузой.
  useEffect(() => {
    if (skipSearch.current) {
      skipSearch.current = false
      return
    }
    if (q === query.q) return
    const t = setTimeout(() => go({ q: q.trim() || null }), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  /** У прошедшего месяца нет предстоящих — он открывается со всеми бронями. Выбор месяца сбрасывает поиск. */
  function pickPeriod(period: string) {
    const past = period !== 'all' && period < currentMonth
    const patch: Record<string, string | null> = {
      month: period === currentMonth ? null : period,
      q: null,
    }
    if (past && query.status === 'upcoming') patch.status = 'all'
    if (q) {
      skipSearch.current = true
      setQ('')
    }
    go(patch)
  }

  const monthIdx =
    query.period === 'all' ? null : Number(query.period.slice(5)) - 1
  const formatName = formats.find((f) => f.id === query.formatId)?.name
  // Поиск идёт по всем месяцам — подписи итогов не должны обещать месяц.
  const searching = Boolean(query.q)

  return (
    <div className={cn('transition-opacity', pending && 'opacity-60')}>
      {canBook && (
        <div className="mb-5 flex justify-end">
          <Button
            onClick={() =>
              setCreate((c) => ({ open: true, round: c.round + 1 }))
            }
            disabled={
              !formats.some((f) => f.isActive) || contracts.length === 0
            }
            title={
              contracts.length === 0 ? 'Для брони нужен договор' : undefined
            }
          >
            <Plus size={17} />
            {role === 'advertiser' ? 'Новая заявка' : 'Новая бронь'}
          </Button>
        </div>
      )}

      <PeriodTabs
        period={query.period}
        currentMonth={currentMonth}
        onPick={pickPeriod}
      />

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <Kpi
          icon={CalendarDays}
          label={
            searching
              ? 'Найдено публикаций'
              : monthIdx === null
                ? 'Публикации за всё время'
                : `Публикации в ${MONTHS_IN[monthIdx]}`
          }
          value={String(stats.events)}
          note={formatName ? `формат «${formatName}»` : 'во всех форматах'}
        />
        <Kpi
          icon={Coins}
          label={
            searching
              ? 'Оплачено по найденным'
              : monthIdx === null
                ? 'Оплачено за всё время'
                : `Оплачено за ${MONTHS_FOR[monthIdx]}`
          }
          value={formatSum(stats.paid)}
          note={`из ${formatSum(stats.total)} по сумме броней`}
        />
        <Kpi
          icon={Hourglass}
          label={
            searching
              ? 'Остаток по найденным'
              : monthIdx === null
                ? 'Остаток за всё время'
                : `Остаток за ${MONTHS_FOR[monthIdx]}`
          }
          value={formatSum(stats.remaining)}
          note="осталось получить от рекламодателей"
          alert={stats.remaining > 0}
        />
      </div>

      {/* Вкладки статусов со счётчиками. */}
      <div className="no-scrollbar -mx-5 mb-5 flex gap-1 overflow-x-auto border-b border-line px-5 sm:mx-0 sm:px-0">
        {FILTERS.map((f) => {
          const on = query.status === f.id
          const fresh = f.id === 'sent' && counts.sent > 0 && !on
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => go({ status: f.id === 'upcoming' ? null : f.id })}
              className={cn(
                'relative flex shrink-0 items-center gap-2 px-3 pb-3 pt-1 text-[13.5px] font-semibold transition-colors focus-ring',
                on ? 'text-ink' : 'text-ink-muted hover:text-ink',
              )}
            >
              {f.label}
              <span
                className={cn(
                  'min-w-5 px-1.5 py-px text-center font-mono text-[11px] tnum',
                  on
                    ? 'bg-forest text-white'
                    : fresh
                      ? 'bg-lime-300 text-forest'
                      : 'bg-ink/6 text-ink-soft',
                )}
              >
                {counts[f.id]}
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

      {/* Поиск и формат. */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Кампания, рекламодатель, договор или формат"
            aria-label="Поиск"
            className="pl-10"
          />
          {query.q && (
            <p className="mt-1.5 text-xs text-ink-muted">
              Ищем по всем месяцам
            </p>
          )}
        </div>
        <div className="w-full sm:w-60">
          <SelectField
            name="formatFilter"
            value={query.formatId || 'all'}
            onChange={(v) => go({ format: v === 'all' ? null : v })}
            options={[
              { value: 'all', label: 'Все форматы' },
              ...formats.map((f) => ({
                value: f.id,
                label: f.name,
                color: f.color,
              })),
            ]}
          />
        </div>
      </div>

      <div className="overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead>
            <tr>
              {[
                '№',
                'Дата',
                'Рекламодатель и кампания',
                'Формат и время',
                'Менеджер',
                'Сумма / оплачено',
                'Остаток',
                'Статус',
                'Договор',
              ].map((h, i) => (
                <th
                  key={h}
                  className={cn(
                    'eyebrow border-b border-line bg-paper/60 px-3 py-3 text-left font-semibold text-ink-muted',
                    i === 0 && 'pl-5',
                    (h === 'Остаток' || h === 'Договор') && 'text-right',
                    h === 'Договор' && 'pr-5',
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((b, index) => {
              const amount = Number(b.amount)
              const paid = Number(b.paid)
              const pct = amount
                ? Math.min(100, Math.round((paid / amount) * 100))
                : 0
              const past = b.date < today
              return (
                <tr
                  key={b.id}
                  onClick={() => setOpenId(b.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setOpenId(b.id)
                    }
                  }}
                  tabIndex={0}
                  className="cursor-pointer border-b border-line transition-colors last:border-b-0 hover:bg-indigo-50/40 focus-visible:bg-indigo-50/60 focus-visible:outline-none"
                >
                  <td className="whitespace-nowrap py-3 pl-5 pr-2 font-mono text-xs text-ink-muted tnum">
                    {(page - 1) * pageSize + index + 1}
                  </td>
                  <td
                    className={cn(
                      'whitespace-nowrap px-3 py-3 font-semibold tnum',
                      past ? 'text-ink-muted' : 'text-ink',
                    )}
                  >
                    {shortDay(b.date)}
                  </td>
                  <td className="max-w-[280px] px-3 py-3">
                    <span className="flex items-center gap-3">
                      {b.advertiserName ? (
                        <BrandAvatar
                          name={b.advertiserName}
                          logo={b.advertiserLogo}
                          color={b.advertiserColor}
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="h-10 w-10 shrink-0 border border-dashed border-ink/20"
                        />
                      )}
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-ink">
                          {b.advertiserName ?? 'Без рекламодателя'}
                        </span>
                        <span className="block truncate text-xs text-ink-muted">
                          {b.campaignName || '—'}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <span className="flex items-center gap-2 font-semibold text-ink">
                      <span
                        className="h-2.5 w-2.5 shrink-0"
                        style={{ background: b.color }}
                      />
                      {b.formatName}
                    </span>
                    <span className="mt-0.5 block pl-[18px] font-mono text-xs text-ink-muted tnum">
                      {b.time}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-ink-soft">
                    {b.managerName ?? (
                      <span className="text-ink-muted">Не назначен</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 tnum">
                    {/* Открывает выплаты; остальная строка — карточку брони. */}
                    <button
                      type="button"
                      aria-label={`Выплаты по брони ${b.campaignName}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setPayingId(b.id)
                      }}
                      onKeyDown={(e) => e.stopPropagation()}
                      className="-m-1.5 block p-1.5 text-left transition-colors hover:bg-ink/4 focus-ring"
                    >
                      {amount ? (
                        <span className="block w-48">
                          <span className="flex items-baseline justify-between gap-3">
                            <span className="text-xs text-ink-muted">
                              {formatSum(amount)}
                            </span>
                            <span
                              className={cn(
                                'font-semibold',
                                paid ? 'text-ink' : 'text-ink-muted',
                              )}
                            >
                              {paid ? formatSum(paid) : '—'}
                            </span>
                          </span>
                          <span
                            role="img"
                            aria-label={`Оплачено ${pct}%`}
                            className="relative mt-1.5 block h-5 overflow-hidden bg-ink/[0.06]"
                          >
                            <span
                              className={cn(
                                'absolute inset-y-0 left-0',
                                pct >= 100 ? 'bg-success' : 'bg-lime-300',
                              )}
                              style={{
                                width: paid ? `${Math.max(pct, 5)}%` : 0,
                              }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center font-mono text-[11px] font-bold text-ink">
                              {pct}%
                            </span>
                          </span>
                        </span>
                      ) : paid ? (
                        formatSum(paid)
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right font-semibold tnum">
                    {amount ? (
                      formatSum(Math.max(0, amount - paid))
                    ) : (
                      <span className="font-normal text-ink-muted">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <span className="inline-flex items-center gap-1.5 border border-line px-2 py-1 text-xs font-semibold text-ink">
                      <span
                        className="h-2 w-2"
                        style={{ background: BOOKING_STATUS[b.status].dot }}
                      />
                      {BOOKING_STATUS[b.status].label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap py-3 pl-3 pr-5 text-right font-mono text-xs text-ink-muted">
                    {b.contractNumber ? `№ ${b.contractNumber}` : '—'}
                  </td>
                </tr>
              )
            })}
            {!rows.length && (
              <tr>
                <td
                  colSpan={9}
                  className="bg-hatch py-14 text-center text-ink-muted"
                >
                  Под эти условия публикаций нет. Сбросьте поиск или выберите
                  другой месяц или статус.
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

      {canBook && (
        <FormDrawer
          open={create.open}
          onClose={() => setCreate((c) => ({ ...c, open: false }))}
          round={create.round}
          title={role === 'advertiser' ? 'Заявка на слот' : 'Бронь слота'}
          description="Выберите дату, время и формат публикации."
          icon={CalendarDays}
          action={createBooking}
          submitLabel={
            role === 'advertiser' ? 'Отправить заявку' : 'Забронировать'
          }
        >
          {(state) => (
            <BookingFields
              role={formRole}
              state={state}
              date={today}
              time="10:00"
              formats={formats}
              managers={managers}
              advertisers={advertisers}
              contracts={contracts}
              currentUserId={currentUserId}
            />
          )}
        </FormDrawer>
      )}

      {canBook && editing.slot && (
        <FormDrawer
          open={editing.open}
          onClose={() => setEditing((e) => ({ ...e, open: false }))}
          round={editing.round}
          title="Изменить бронь"
          description={`${editing.slot.formatName} · ${longDay(editing.slot.date)}`}
          icon={Pencil}
          action={updateBooking}
          submitLabel="Сохранить"
        >
          {(state) =>
            editing.slot && (
              <BookingFields
                role={formRole}
                initial={editing.slot}
                state={state}
                date={editing.slot.date}
                time={editing.slot.time}
                formats={formats}
                managers={managers}
                advertisers={advertisers}
                contracts={contracts}
                currentUserId={currentUserId}
              />
            )
          }
        </FormDrawer>
      )}

      <SlotDetails
        slot={opened}
        role={role}
        onClose={() => setOpenId(null)}
        onEdit={(slot) =>
          setEditing((e) => ({ open: true, slot, round: e.round + 1 }))
        }
      />

      {/* Выплаты по брони — из колонки «Сумма / оплачено». */}
      <Modal
        open={paying != null}
        onClose={() => setPayingId(null)}
        size="sm"
        wide
        icon={Wallet}
        title={paying ? paying.campaignName || paying.formatName : ''}
        description={
          paying
            ? `${paying.advertiserName ?? ''} · ${longDay(paying.date)}, ${paying.time}`
            : undefined
        }
      >
        {paying && <PaymentsBlock slot={paying} canEdit={isEditor(role)} />}
      </Modal>
    </div>
  )
}
