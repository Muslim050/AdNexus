'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  PanelRight,
  Pencil,
  Plus,
} from 'lucide-react'
import { createBooking, updateBooking } from '@/app/actions/bookings'
import { FormDrawer } from '@/components/forms/CreateDrawer'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { isEditor, type Role } from '@/lib/roles'
import { nextHalfHour } from '@/lib/useNow'
import { useStoredFlag } from '@/lib/useStoredFlag'
import { addDays, humanDate, longDay, weekDays, weekTitle } from '@/lib/week'
import {
  BookingFields,
  type AdvertiserChoice,
  type ContractChoice,
  type FormatChoice,
  type ManagerChoice,
} from './BookingFields'
import { FormatLegend, StatusLegend } from './FormatLegend'
import { GroupedDays } from './GroupedDays'
import { MiniMonth } from './MiniMonth'
import { SlotDetails } from './SlotDetails'
import { TimeGrid } from './TimeGrid'
import type { CalendarSlot, CalendarView as View, ListPeriod } from './types'
import { useCalendarHref } from './useCalendarHref'
import { UpcomingPanel } from './UpcomingPanel'

interface Props {
  view: View
  /** Выбранный день: в режиме «Неделя» — любой день недели. */
  anchor: string
  weekStart: string
  today: string
  slots: CalendarSlot[]
  /** Список справа: его период и публикации. */
  period: ListPeriod
  listed: CalendarSlot[]
  /** Есть ли что догрузить в ленту до и после. */
  moreBefore: boolean
  moreAfter: boolean
  formats: FormatChoice[]
  managers: ManagerChoice[]
  advertisers: AdvertiserChoice[]
  contracts: ContractChoice[]
  role: Role
  currentUserId: string
}

export function CalendarView({
  view,
  anchor,
  weekStart,
  today,
  slots,
  period,
  listed,
  moreBefore,
  moreAfter,
  formats,
  managers,
  advertisers,
  contracts,
  role,
  currentUserId,
}: Props) {
  // Бронирует admin и рекламодатель; viewer только смотрит.
  const canBook = role === 'advertiser' || isEditor(role)
  const formRole = role === 'advertiser' ? 'advertiser' : 'staff'
  const days = view === 'day' ? [anchor] : weekDays(weekStart)
  const step = view === 'day' ? 1 : 7
  const calendarHref = useCalendarHref()
  const [hidden, setHidden] = useState<string[]>([])
  const [create, setCreate] = useState({
    open: false,
    date: today,
    time: '10:00',
    formatId: '',
    round: 0,
  })
  // Открытую бронь берём из свежих данных по id: после выплаты или смены
  // статуса сервер присылает обновлённые слоты, и карточка обновляется сама.
  const [openedId, setOpenedId] = useState<string | null>(null)
  const opened = [...slots, ...listed].find((s) => s.id === openedId) ?? null
  const [panelHidden, setPanelHidden] = useStoredFlag('calendar-panel-hidden')
  const [grouped, setGrouped] = useStoredFlag('calendar-grouped')
  const [editing, setEditing] = useState<{
    open: boolean
    slot: CalendarSlot | null
    round: number
  }>({ open: false, slot: null, round: 0 })
  const startEdit = (slot: CalendarSlot) =>
    setEditing((e) => ({ open: true, slot, round: e.round + 1 }))

  const canCreate =
    canBook &&
    formats.some((f) => f.isActive) &&
    // Рекламодателю без договора бронировать не по чему.
    (role !== 'advertiser' || contracts.length > 0)
  const createHint =
    role === 'advertiser' && contracts.length === 0
      ? 'Для брони нужен договор — обратитесь к менеджеру'
      : 'Сначала добавьте формат в «Справочнике»'
  const book = (date: string, time: string, formatId = '') =>
    setCreate((c) => ({
      open: true,
      date,
      time,
      formatId,
      round: c.round + 1,
    }))
  // Кнопка «Забронировать»: ближайшие полчаса; день — сегодня, если он на
  // экране, иначе первый показанный, но не в прошлом.
  const bookDefault = () => {
    const next = nextHalfHour()
    const day =
      days.includes(next.date) || days[0] < next.date ? next.date : days[0]
    book(day, next.time)
  }

  const visible = slots.filter((s) => !hidden.includes(s.formatId))
  const toggle = (id: string) =>
    setHidden((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]))

  return (
    <div
      className={cn(
        'grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] wide:min-h-0 wide:flex-1 wide:grid-rows-[minmax(0,1fr)]',
        !panelHidden && 'wide:grid-cols-[220px_minmax(0,1fr)_264px]',
      )}
    >
      {/* -m-1 p-1 — чтобы прокрутка не обрезала рамку фокуса. */}
      <aside className="hidden space-y-7 lg:block wide:-m-1 wide:overflow-y-auto wide:p-1">
        {canBook && (
          <Button
            onClick={bookDefault}
            disabled={!canCreate}
            title={!canCreate ? createHint : undefined}
            className="w-full justify-start"
          >
            <Plus size={17} />
            Забронировать слот
          </Button>
        )}
        <MiniMonth
          key={`${view}-${anchor}`}
          view={view}
          anchor={anchor}
          from={days[0]}
          to={days[days.length - 1]}
          today={today}
        />
        <FormatLegend formats={formats} hidden={hidden} onToggle={toggle} />
        <StatusLegend />
      </aside>

      <section className="min-w-0 border border-line bg-surface wide:flex wide:min-h-0 wide:flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-3 sm:px-4">
          <Link
            href={calendarHref(view)}
            className="flex h-9 items-center border border-ink/20 px-3 sm:px-4 text-[13px] font-semibold text-ink transition-colors hover:border-ink focus-ring"
          >
            Сегодня
          </Link>
          <div className="flex">
            <Link
              href={calendarHref(view, addDays(anchor, -step))}
              aria-label={
                view === 'day' ? 'Предыдущий день' : 'Предыдущая неделя'
              }
              className="flex h-9 w-9 items-center justify-center text-ink-soft hover:bg-ink/6 hover:text-ink focus-ring"
            >
              <ChevronLeft size={18} />
            </Link>
            <Link
              href={calendarHref(view, addDays(anchor, step))}
              aria-label={
                view === 'day' ? 'Следующий день' : 'Следующая неделя'
              }
              className="flex h-9 w-9 items-center justify-center text-ink-soft hover:bg-ink/6 hover:text-ink focus-ring"
            >
              <ChevronRight size={18} />
            </Link>
          </div>
          <h2 className="min-w-0 font-display text-[16px] font-bold text-ink sm:text-xl">
            {view === 'day' ? humanDate(anchor) : weekTitle(weekStart)}
          </h2>

          {/* На телефоне — второй строкой во всю ширину: режим, группы, бронь. */}
          <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto sm:flex-wrap">
            <span className="eyebrow hidden text-ink-muted 2xl:block">
              {visible.length} {plural(visible.length)}
            </span>
            <label
              title="Слоты дня — по форматам, без шкалы времени"
              className="flex h-9 cursor-pointer items-center gap-2 text-[13px] sm:px-1.5 font-semibold text-ink-soft transition-colors hover:text-ink"
            >
              <input
                type="checkbox"
                checked={grouped}
                onChange={(e) => setGrouped(e.target.checked)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-[18px] w-[18px] shrink-0 items-center justify-center border-2 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 peer-focus-visible:ring-offset-1',
                  grouped
                    ? 'border-indigo-500 bg-indigo-500 text-white'
                    : 'border-ink/30',
                )}
              >
                {grouped && <Check size={13} strokeWidth={3} />}
              </span>
              Группировать
            </label>
            {/* Режим: неделя или день. */}
            <div
              className="flex border border-ink/20"
              role="group"
              aria-label="Режим"
            >
              {(['week', 'day'] as const).map((v) => (
                <Link
                  key={v}
                  href={calendarHref(v, anchor)}
                  aria-current={view === v ? 'page' : undefined}
                  className={cn(
                    'flex h-9 items-center px-3.5 text-[13px] font-semibold transition-colors focus-ring',
                    view === v
                      ? 'bg-forest text-white'
                      : 'text-ink-soft hover:bg-ink/6 hover:text-ink',
                  )}
                >
                  {v === 'week' ? 'Неделя' : 'День'}
                </Link>
              ))}
            </div>
            {panelHidden && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPanelHidden(false)}
              >
                <PanelRight size={15} />
                Список
              </Button>
            )}
            {canBook && (
              <Button
                size="sm"
                onClick={bookDefault}
                disabled={!canCreate}
                aria-label="Забронировать слот"
                className="ml-auto max-sm:w-9 max-sm:px-0 lg:hidden"
              >
                <Plus size={15} />
                <span className="max-sm:hidden">Слот</span>
              </Button>
            )}
          </div>
        </div>

        {grouped ? (
          <GroupedDays
            days={days}
            today={today}
            slots={visible}
            formats={formats}
            ownBrand={role === 'advertiser'}
            canCreate={canCreate}
            onBook={(date, formatId) =>
              book(date, nextHalfHour().time, formatId)
            }
            onOpen={(s) => setOpenedId(s.id)}
          />
        ) : (
          <TimeGrid
            days={days}
            today={today}
            slots={visible}
            ownBrand={role === 'advertiser'}
            canCreate={canCreate}
            onBook={book}
            onOpen={(s) => setOpenedId(s.id)}
          />
        )}

        {formats.length === 0 && (
          <p className="border-t border-line bg-hatch px-4 py-3 text-sm text-ink-muted">
            Форматов публикаций пока нет — добавьте их в разделе{' '}
            <Link
              href="/directory"
              className="font-semibold text-indigo-600 underline-offset-2 hover:underline"
            >
              «Справочник»
            </Link>
            , затем бронируйте слоты.
          </p>
        )}
      </section>

      {!panelHidden && (
        <div className="relative min-w-0 lg:col-start-2 wide:col-start-auto">
          <UpcomingPanel
            today={today}
            period={period}
            moreBefore={moreBefore}
            moreAfter={moreAfter}
            slots={listed.filter((s) => !hidden.includes(s.formatId))}
            onOpen={(s) => setOpenedId(s.id)}
            onHide={() => setPanelHidden(true)}
            onBook={canBook ? bookDefault : undefined}
            canCreate={canCreate}
            createHint={createHint}
          />
        </div>
      )}

      <div className="lg:hidden">
        <FormatLegend formats={formats} hidden={hidden} onToggle={toggle} />
      </div>

      {canBook && (
        <FormDrawer
          open={create.open}
          onClose={() => setCreate((c) => ({ ...c, open: false }))}
          round={create.round}
          title={role === 'advertiser' ? 'Заявка на слот' : 'Бронь слота'}
          description={longDay(create.date)}
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
              presetFormatId={create.formatId}
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
        onClose={() => setOpenedId(null)}
        onEdit={startEdit}
      />
    </div>
  )
}

function plural(n: number) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'слот'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'слота'
  return 'слотов'
}
