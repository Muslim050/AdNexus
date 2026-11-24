'use client'

import { useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { textOn } from '@/lib/palette'
import { useNow } from '@/lib/useNow'
import { dayOfWeek, longDay } from '@/lib/week'
import type { FormatChoice } from './BookingFields'
import { DayHead } from './DayHead'
import { SlotChip } from './SlotChip'
import type { CalendarSlot } from './types'

interface Props {
  days: string[]
  today: string
  slots: CalendarSlot[]
  /** Порядок групп — как в справочнике. */
  formats: FormatChoice[]
  /** Рекламодатель видит только свои слоты — бренд в подписи лишний. */
  ownBrand: boolean
  canCreate: boolean
  onBook: (date: string, formatId?: string) => void
  onOpen: (slot: CalendarSlot) => void
}

/** Подпись в группе: формат уже в заголовке, остаются время, бренд, кампания. */
const groupLabel = (s: CalendarSlot, ownBrand: boolean) =>
  [
    s.time,
    ...(s.masked
      ? ['Занято']
      : [!ownBrand && s.advertiserName, s.campaignName]),
  ]
    .filter(Boolean)
    .join(' · ')

/**
 * Дни без шкалы времени: слоты собраны по формату, внутри — по времени.
 * Группа сворачивается, вышедшие слоты приглушены.
 */
export function GroupedDays({
  days,
  today,
  slots,
  formats,
  ownBrand,
  canCreate,
  onBook,
  onOpen,
}: Props) {
  const now = useNow()
  // Свёрнутые группы по ключу «день|формат».
  const [closed, setClosed] = useState<string[]>([])
  const toggle = (key: string) =>
    setClosed((c) =>
      c.includes(key) ? c.filter((k) => k !== key) : [...c, key],
    )
  const cols = { gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }

  return (
    <div className="relative h-[calc(100vh-300px)] min-h-[460px] overflow-auto wide:h-auto wide:min-h-0 wide:flex-1">
      <div
        className={cn(
          'flex min-h-full flex-col',
          days.length > 1 && 'min-w-[760px]',
        )}
      >
        <div
          className="sticky top-0 z-30 grid border-b border-line bg-surface"
          style={cols}
        >
          {days.map((day) => (
            <DayHead key={day} day={day} today={today} />
          ))}
        </div>

        <div className="grid flex-1" style={cols}>
          {days.map((day) => {
            const daySlots = slots
              .filter((s) => s.date === day)
              .sort((a, b) => a.time.localeCompare(b.time))
            const groups = formats
              .map((format) => ({
                format,
                list: daySlots.filter((s) => s.formatId === format.id),
              }))
              .filter((g) => g.list.length > 0)
            const isPassed = (s: CalendarSlot) =>
              now != null && `${s.date} ${s.time}` <= `${now.date} ${now.time}`
            return (
              <div
                key={day}
                className={cn(
                  'flex min-w-0 flex-col gap-2 border-l border-line p-1.5',
                  dayOfWeek(day) >= 5 && 'bg-paper/50',
                )}
              >
                {groups.map(({ format, list }) => {
                  const key = `${day}|${format.id}`
                  const open = !closed.includes(key)
                  return (
                    <section key={format.id} className="min-w-0">
                      <div className="group relative">
                        <button
                          type="button"
                          onClick={() => toggle(key)}
                          aria-expanded={open}
                          title={format.name}
                          className="flex min-h-8 w-full items-center gap-1.5 py-1 text-left text-[12px] font-semibold leading-tight text-ink-soft transition-colors hover:text-ink focus-ring"
                        >
                          <span
                            aria-hidden="true"
                            className="flex h-4 w-4 shrink-0 items-center justify-center"
                            style={{
                              background: format.color,
                              color: textOn(format.color),
                            }}
                          >
                            <ChevronDown
                              size={12}
                              strokeWidth={2.5}
                              className={cn(
                                'transition-transform',
                                !open && '-rotate-90',
                              )}
                            />
                          </span>
                          <span className="line-clamp-2 min-w-0 flex-1 break-words">
                            {format.name}
                          </span>
                          <span className="min-w-5 shrink-0 text-center font-mono text-[11px] text-ink-muted tnum">
                            {list.length}
                          </span>
                        </button>
                        {/* «+» встаёт на место счётчика; без мыши бронь — кнопкой под днём. */}
                        {canCreate && format.isActive && (
                          <button
                            type="button"
                            onClick={() => onBook(day, format.id)}
                            title={`Забронировать: ${format.name}`}
                            aria-label={`Забронировать: ${format.name}, ${longDay(day)}`}
                            className="absolute inset-y-0 right-0 flex w-6 items-center justify-center bg-surface text-indigo-600 opacity-0 transition-opacity hover:bg-indigo-50 focus-visible:opacity-100 group-hover:opacity-100 pointer-coarse:hidden focus-ring"
                          >
                            <Plus size={14} />
                          </button>
                        )}
                      </div>
                      {open && (
                        <div className="space-y-[3px]">
                          {list.map((s) => (
                            <SlotChip
                              key={s.id}
                              slot={s}
                              label={groupLabel(s, ownBrand)}
                              passed={isPassed(s)}
                              onOpen={onOpen}
                            />
                          ))}
                        </div>
                      )}
                    </section>
                  )
                })}
                {canCreate ? (
                  <button
                    type="button"
                    onClick={() => onBook(day)}
                    aria-label={`Забронировать слот: ${longDay(day)}`}
                    title="Забронировать слот"
                    className="flex min-h-9 shrink-0 items-center justify-center border border-dashed border-ink/15 text-ink-muted transition-colors hover:border-indigo-500 hover:bg-indigo-50/70 hover:text-indigo-600 focus-ring"
                  >
                    <Plus size={15} />
                  </button>
                ) : (
                  groups.length === 0 && (
                    <p className="pt-2 text-center text-[12px] text-ink-muted">
                      Пусто
                    </p>
                  )
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
