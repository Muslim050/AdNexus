'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { createBooking } from '@/app/actions/bookings'
import { FormDrawer } from '@/components/forms/CreateDrawer'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { addDays, humanDate, longDay, weekDays, weekTitle } from '@/lib/week'
import {
  BookingFields,
  type AdvertiserChoice,
  type ContractChoice,
  type FormatChoice,
  type ManagerChoice,
} from './BookingFields'
import { FormatLegend } from './FormatLegend'
import { MiniMonth } from './MiniMonth'
import { SlotDetails } from './SlotDetails'
import { TimeGrid } from './TimeGrid'
import {
  calendarHref,
  type CalendarSlot,
  type CalendarView as View,
} from './types'

interface Props {
  view: View
  /** Выбранный день: в режиме «Неделя» — любой день недели. */
  anchor: string
  weekStart: string
  today: string
  slots: CalendarSlot[]
  formats: FormatChoice[]
  managers: ManagerChoice[]
  advertisers: AdvertiserChoice[]
  contracts: ContractChoice[]
  canBook: boolean
  currentUserId: string
}

export function CalendarView({
  view,
  anchor,
  weekStart,
  today,
  slots,
  formats,
  managers,
  advertisers,
  contracts,
  canBook,
  currentUserId,
}: Props) {
  const days = view === 'day' ? [anchor] : weekDays(weekStart)
  const step = view === 'day' ? 1 : 7
  const [hidden, setHidden] = useState<string[]>([])
  const [create, setCreate] = useState({
    open: false,
    date: today,
    time: '10:00',
    round: 0,
  })
  const [opened, setOpened] = useState<CalendarSlot | null>(null)

  const canCreate = canBook && formats.some((f) => f.isActive)
  const book = (date: string, time = '10:00') =>
    setCreate((c) => ({ open: true, date, time, round: c.round + 1 }))
  // Кнопка «Забронировать»: сегодня, если оно на экране, иначе первый день.
  const bookDefault = () => book(days.includes(today) ? today : days[0])

  const visible = slots.filter((s) => !hidden.includes(s.formatId))
  const toggle = (id: string) =>
    setHidden((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]))

  return (
    <div className="grid gap-6 lg:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="hidden space-y-7 lg:block">
        {canBook && (
          <Button
            onClick={bookDefault}
            disabled={!canCreate}
            title={
              !canCreate ? 'Сначала добавьте формат в «Справочнике»' : undefined
            }
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
      </aside>

      <section className="min-w-0 border border-line bg-surface">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-3 sm:px-4">
          <Link
            href={calendarHref(view)}
            className="flex h-9 items-center border border-ink/20 px-4 text-[13px] font-semibold text-ink transition-colors hover:border-ink focus-ring"
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
          <h2 className="font-display text-lg font-bold text-ink sm:text-xl">
            {view === 'day' ? humanDate(anchor) : weekTitle(weekStart)}
          </h2>

          <div className="ml-auto flex items-center gap-2">
            <span className="eyebrow hidden text-ink-muted xl:block">
              {visible.length} {plural(visible.length)}
            </span>
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
            {canBook && (
              <Button
                size="sm"
                onClick={bookDefault}
                disabled={!canCreate}
                className="lg:hidden"
              >
                <Plus size={15} />
                Слот
              </Button>
            )}
          </div>
        </div>

        <TimeGrid
          days={days}
          today={today}
          slots={visible}
          canCreate={canCreate}
          onBook={book}
          onOpen={setOpened}
        />

        {formats.length === 0 && (
          <p className="border-t border-line bg-hatch px-4 py-3 text-sm text-ink-muted">
            Форматов размещений пока нет — добавьте их в разделе{' '}
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

      <div className="lg:hidden">
        <FormatLegend formats={formats} hidden={hidden} onToggle={toggle} />
      </div>

      {canBook && (
        <FormDrawer
          open={create.open}
          onClose={() => setCreate((c) => ({ ...c, open: false }))}
          round={create.round}
          title="Бронь слота"
          description={longDay(create.date)}
          icon={CalendarDays}
          action={createBooking}
          submitLabel="Забронировать"
        >
          {(state) => (
            <BookingFields
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

      <SlotDetails
        slot={opened}
        canDelete={canBook}
        onClose={() => setOpened(null)}
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
