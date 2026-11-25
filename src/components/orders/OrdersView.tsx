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
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { SelectField } from '@/components/ui/SelectField'
import { cn } from '@/lib/cn'
import { formatSum } from '@/lib/forms'
import { isEditor, type Role } from '@/lib/roles'
import { nextHalfHour } from '@/lib/useNow'
import { longDay } from '@/lib/week'
import type { OrdersFilter } from '@/lib/data/orders'
import { Kpi } from './Kpi'
import { OrderCards } from './OrderCards'
import { OrdersTable } from './OrdersTable'
import { Pager } from './Pager'
import { PeriodTabs } from './PeriodTabs'

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
  const [create, setCreate] = useState({
    open: false,
    round: 0,
    date: today,
    time: '10:00',
  })
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

  // Хоть один фильтр сужает список — пустому списку нужен выход.
  const filtered =
    Boolean(query.q || query.formatId) ||
    query.status !== 'all' ||
    query.period !== 'all'
  const showAll = () => {
    if (q) {
      skipSearch.current = true
      setQ('')
    }
    go({ status: 'all', month: 'all', q: null, format: null })
  }

  const monthIdx =
    query.period === 'all' ? null : Number(query.period.slice(5)) - 1
  const formatName = formats.find((f) => f.id === query.formatId)?.name
  // Поиск идёт по всем месяцам — подписи итогов не должны обещать месяц.
  const searching = Boolean(query.q)

  return (
    <div className={cn('transition-opacity', pending && 'opacity-60')}>
      <PeriodTabs
        period={query.period}
        currentMonth={currentMonth}
        onPick={pickPeriod}
        action={
          canBook && (
            <Button
              onClick={() =>
                setCreate((c) => ({
                  open: true,
                  round: c.round + 1,
                  ...nextHalfHour(),
                }))
              }
              disabled={
                !formats.some((f) => f.isActive) || contracts.length === 0
              }
              title={
                contracts.length === 0 ? 'Для брони нужен договор' : undefined
              }
              className="h-[42px]"
            >
              <Plus size={17} />
              {role === 'advertiser' ? 'Новая заявка' : 'Новая бронь'}
            </Button>
          )
        }
      />

      <div className="mb-6 grid gap-2 sm:gap-3 md:grid-cols-3">
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
            label="Формат"
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

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-4 border border-line bg-hatch px-5 py-14 text-center">
          <p className="text-sm text-ink-muted">
            {filtered
              ? 'Под эти условия публикаций нет.'
              : 'Публикаций пока нет — забронируйте первый слот.'}
          </p>
          {filtered && (
            <Button variant="secondary" size="sm" onClick={showAll}>
              Показать все публикации
            </Button>
          )}
        </div>
      ) : (
        <>
          <OrdersTable
            className="hidden xl:block"
            rows={rows}
            firstIndex={(page - 1) * pageSize + 1}
            today={today}
            onOpen={setOpenId}
            onPay={setPayingId}
          />
          {/* Таблице нужно 1200 px: уже — те же публикации карточками. */}
          <OrderCards
            className="xl:hidden"
            rows={rows}
            today={today}
            onOpen={setOpenId}
            onPay={setPayingId}
          />
        </>
      )}

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
              date={create.date}
              time={create.time}
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
