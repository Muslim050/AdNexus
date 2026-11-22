'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Hash,
  MessageSquare,
  Plus,
  Trash2,
  User,
} from 'lucide-react'
import { deleteBooking, createBooking } from '@/app/actions/bookings'
import { FormDrawer } from '@/components/forms/CreateDrawer'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { textOn } from '@/lib/palette'
import {
  WEEKDAYS,
  addDays,
  dayOfMonth,
  longDay,
  weekDays,
  weekTitle,
} from '@/lib/week'
import {
  BookingFields,
  type FormatChoice,
  type ManagerChoice,
} from './BookingFields'
import { MiniMonth } from './MiniMonth'

export interface CalendarSlot {
  id: string
  date: string
  time: string
  orderRef: string
  comment: string
  createdBy: string
  formatId: string
  formatName: string
  color: string
  managerName: string
}

interface Props {
  weekStart: string
  today: string
  slots: CalendarSlot[]
  formats: FormatChoice[]
  managers: ManagerChoice[]
  canBook: boolean
  currentUserId: string
}

/** Подпись слота как в календаре: «10:30 | Айша | Post Instagram uzb | 3047». */
const slotLabel = (s: CalendarSlot) =>
  [s.time, s.managerName, s.formatName, s.orderRef].filter(Boolean).join(' | ')

export function CalendarView({
  weekStart,
  today,
  slots,
  formats,
  managers,
  canBook,
  currentUserId,
}: Props) {
  const days = weekDays(weekStart)
  const [hidden, setHidden] = useState<string[]>([])
  const [create, setCreate] = useState({ open: false, date: today, round: 0 })
  const [opened, setOpened] = useState<CalendarSlot | null>(null)

  const canCreate = canBook && formats.some((f) => f.isActive)
  const book = (date: string) =>
    setCreate((c) => ({ open: true, date, round: c.round + 1 }))

  const visible = slots.filter((s) => !hidden.includes(s.formatId))
  const toggle = (id: string) =>
    setHidden((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]))

  return (
    <div className="grid gap-6 lg:grid-cols-[232px_minmax(0,1fr)]">
      {/* Боковая колонка: создать, месяц, форматы. */}
      <aside className="hidden space-y-7 lg:block">
        {canBook && (
          <Button
            onClick={() =>
              book(today >= days[0] && today <= days[6] ? today : days[0])
            }
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
        <MiniMonth key={weekStart} weekStart={weekStart} today={today} />
        <FormatLegend formats={formats} hidden={hidden} onToggle={toggle} />
      </aside>

      <section className="min-w-0 border border-line bg-surface">
        {/* Панель: сегодня, стрелки, месяц. */}
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-3 sm:px-4">
          <Link
            href="/calendar"
            className="flex h-9 items-center border border-ink/20 px-4 text-[13px] font-semibold text-ink transition-colors hover:border-ink focus-ring"
          >
            Сегодня
          </Link>
          <div className="flex">
            <Link
              href={`/calendar?d=${addDays(weekStart, -7)}`}
              aria-label="Предыдущая неделя"
              className="flex h-9 w-9 items-center justify-center text-ink-soft hover:bg-ink/6 hover:text-ink focus-ring"
            >
              <ChevronLeft size={18} />
            </Link>
            <Link
              href={`/calendar?d=${addDays(weekStart, 7)}`}
              aria-label="Следующая неделя"
              className="flex h-9 w-9 items-center justify-center text-ink-soft hover:bg-ink/6 hover:text-ink focus-ring"
            >
              <ChevronRight size={18} />
            </Link>
          </div>
          <h2 className="font-display text-lg font-bold text-ink sm:text-xl">
            {weekTitle(weekStart)}
          </h2>
          <span className="eyebrow ml-auto hidden text-ink-muted sm:block">
            Неделя · {visible.length} {plural(visible.length)}
          </span>
          {canBook && (
            <Button
              size="sm"
              onClick={() =>
                book(days[0] <= today && today <= days[6] ? today : days[0])
              }
              disabled={!canCreate}
              className="lg:hidden"
            >
              <Plus size={15} />
              Слот
            </Button>
          )}
        </div>

        {/* Неделя: семь колонок, слоты по времени. */}
        <div className="overflow-x-auto">
          <div className="grid min-w-[840px] grid-cols-7">
            {days.map((day, i) => {
              const isToday = day === today
              const weekend = i >= 5
              const daySlots = visible.filter((s) => s.date === day)
              return (
                <div
                  key={day}
                  className={cn(
                    'flex min-h-[420px] flex-col border-line',
                    i > 0 && 'border-l',
                    weekend && 'bg-paper/50',
                  )}
                >
                  <div className="flex flex-col items-center gap-1 border-b border-line py-3">
                    <span
                      className={cn(
                        'font-mono text-[10.5px] font-semibold tracking-wider',
                        isToday ? 'text-indigo-600' : 'text-ink-muted',
                      )}
                    >
                      {WEEKDAYS[i]}
                    </span>
                    <span
                      className={cn(
                        'flex h-10 w-10 items-center justify-center font-display text-[22px] font-semibold tnum',
                        isToday ? 'bg-indigo-500 text-white' : 'text-ink',
                      )}
                    >
                      {dayOfMonth(day)}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-[3px] p-1.5">
                    {daySlots.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setOpened(s)}
                        title={slotLabel(s)}
                        className="w-full truncate rounded-sm px-1.5 py-[3px] text-left text-[12px] font-semibold leading-[1.35] transition-[filter] hover:brightness-110 focus-ring"
                        style={{ background: s.color, color: textOn(s.color) }}
                      >
                        {slotLabel(s)}
                      </button>
                    ))}
                    {canCreate ? (
                      <button
                        type="button"
                        onClick={() => book(day)}
                        aria-label={`Забронировать слот на ${longDay(day)}`}
                        className="group mt-1 flex min-h-12 flex-1 items-start justify-center pt-2 text-ink-muted/0 transition-colors hover:bg-indigo-50/60 hover:text-indigo-600 focus-ring"
                      >
                        <Plus
                          size={16}
                          className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                        />
                      </button>
                    ) : (
                      daySlots.length === 0 && <div className="flex-1" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

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

      {/* Легенда форматов на узких экранах — под календарём. */}
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
              formats={formats}
              managers={managers}
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

function FormatLegend({
  formats,
  hidden,
  onToggle,
}: {
  formats: FormatChoice[]
  hidden: string[]
  onToggle: (id: string) => void
}) {
  if (formats.length === 0) return null
  return (
    <div>
      <p className="eyebrow mb-2 text-ink-muted">Форматы</p>
      <ul className="space-y-0.5">
        {formats.map((f) => {
          const shown = !hidden.includes(f.id)
          return (
            <li key={f.id}>
              <label className="flex cursor-pointer items-center gap-2.5 px-1 py-1.5 text-[13px] text-ink-soft hover:bg-ink/4">
                <input
                  type="checkbox"
                  checked={shown}
                  onChange={() => onToggle(f.id)}
                  className="peer sr-only"
                />
                <span
                  className="flex h-[18px] w-[18px] shrink-0 items-center justify-center border-2 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 peer-focus-visible:ring-offset-1"
                  style={{
                    borderColor: f.color,
                    background: shown ? f.color : 'transparent',
                  }}
                >
                  {shown && (
                    <svg
                      viewBox="0 0 12 12"
                      className="h-3 w-3"
                      aria-hidden="true"
                    >
                      <path
                        d="M2.5 6.2 5 8.5l4.5-5"
                        fill="none"
                        stroke={textOn(f.color)}
                        strokeWidth="1.8"
                      />
                    </svg>
                  )}
                </span>
                <span className={cn('truncate', !f.isActive && 'line-through')}>
                  {f.name}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function SlotDetails({
  slot,
  canDelete,
  onClose,
}: {
  slot: CalendarSlot | null
  canDelete: boolean
  onClose: () => void
}) {
  const toast = useToast()
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition] = useTransition()

  const close = () => {
    setConfirming(false)
    onClose()
  }

  const remove = () => {
    if (!slot) return
    startTransition(async () => {
      const result = await deleteBooking(slot.id)
      if (result.ok) {
        toast.success(result.message ?? 'Бронь снята')
        close()
      } else {
        toast.error(result.error ?? 'Не удалось снять бронь')
      }
    })
  }

  return (
    <Modal
      open={slot != null}
      onClose={close}
      size="sm"
      title={slot?.formatName ?? ''}
      description={slot ? longDay(slot.date) : undefined}
      footer={
        canDelete && slot ? (
          confirming ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirming(false)}
                disabled={pending}
              >
                Отмена
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={remove}
                disabled={pending}
              >
                {pending ? 'Снимаем…' : 'Да, снять бронь'}
              </Button>
            </>
          ) : (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirming(true)}
            >
              <Trash2 size={15} />
              Снять бронь
            </Button>
          )
        ) : undefined
      }
    >
      {slot && (
        <dl className="space-y-3 text-sm">
          <div
            className="h-1.5 w-full"
            style={{ background: slot.color }}
            aria-hidden="true"
          />
          <Detail icon={Clock} label="Время" value={slot.time} />
          <Detail icon={User} label="Менеджер" value={slot.managerName} />
          <Detail
            icon={Hash}
            label="Номер заказа"
            value={slot.orderRef || '—'}
          />
          {slot.comment && (
            <Detail
              icon={MessageSquare}
              label="Комментарий"
              value={slot.comment}
            />
          )}
          <p className="pt-1 text-xs text-ink-muted">
            Забронировал: {slot.createdBy}
          </p>
        </dl>
      )}
    </Modal>
  )
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock
  label: string
  value: string
}) {
  return (
    <div className="flex gap-3">
      <Icon size={16} className="mt-0.5 shrink-0 text-ink-muted" />
      <div className="min-w-0">
        <dt className="eyebrow text-ink-muted">{label}</dt>
        <dd className="mt-0.5 whitespace-pre-line font-medium text-ink">
          {value}
        </dd>
      </div>
    </div>
  )
}
