'use client'

import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { DayHead } from './DayHead'
import { NowTag } from './NowTag'
import { SlotChip } from './SlotChip'
import { useNow } from '@/lib/useNow'
import { dayOfWeek, longDay } from '@/lib/week'
import type { CalendarSlot } from './types'

const pad = (n: number) => String(n).padStart(2, '0')

/** Строки сетки по 30 минут: 00:00, 00:30 … 23:30. */
const ROWS = Array.from(
  { length: 48 },
  (_, i) => `${pad(Math.floor(i / 2))}:${i % 2 ? '30' : '00'}`,
)

const minutesOf = (time: string) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}
const rowOf = (time: string) => Math.floor(minutesOf(time) / 30)

/** На столько пикселей от красной полосы курсор ещё считается наведённым. */
const NOW_REACH = 6

/** Без брони и без «сейчас» на экране — с 08:00, начала рабочего дня. */
const DEFAULT_ROW = 16

interface Props {
  days: string[]
  today: string
  slots: CalendarSlot[]
  canCreate: boolean
  onBook: (date: string, time: string) => void
  onOpen: (slot: CalendarSlot) => void
}

/**
 * Сетка дня или недели по времени: строка — полчаса, подписи 13:00, 13:30…
 * Слоты встают в строку своего получаса; когда их много, строка растёт.
 * Красная полоса — текущее время по Ташкенту.
 */
export function TimeGrid({
  days,
  today,
  slots,
  canCreate,
  onBook,
  onOpen,
}: Props) {
  const now = useNow()
  const scrollRef = useRef<HTMLDivElement>(null)
  const nowRow = now ? rowOf(now.time) : null
  const showsToday = days.includes(today)
  // Доля строки, на которой стоит красная полоса.
  const nowShare = now ? (minutesOf(now.time) % 30) / 30 : 0
  const [nowHover, setNowHover] = useState(false)

  // Наведение ловит ячейка, а не сама полоса: полоса лежит поверх слотов и
  // не должна перехватывать клики по ним.
  const trackNow = (e: PointerEvent<HTMLElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const y = box.top + box.height * nowShare
    setNowHover(Math.abs(e.clientY - y) <= NOW_REACH)
  }

  // Ячейки по ключу «дата|строка».
  const cells = new Map<string, CalendarSlot[]>()
  for (const s of slots) {
    const key = `${s.date}|${rowOf(s.time)}`
    cells.set(key, [...(cells.get(key) ?? []), s])
  }

  // При открытии — к текущему часу (если сегодня на экране), иначе к первой
  // брони или к 08:00. Только прокрутка DOM, состояние не меняем.
  const firstRow = slots.length
    ? Math.min(...slots.map((s) => rowOf(s.time)))
    : DEFAULT_ROW
  const targetRow =
    showsToday && nowRow != null ? Math.max(nowRow - 2, 0) : firstRow
  const daysKey = days.join(',')
  useEffect(() => {
    const box = scrollRef.current
    const row = box?.querySelector<HTMLElement>(`[data-row="${targetRow}"]`)
    const header = box?.querySelector<HTMLElement>('[data-grid-header]')
    if (box && row) box.scrollTop = row.offsetTop - (header?.offsetHeight ?? 0)
    // Прокручиваем при смене недели/дня и когда «сейчас» стало известно.
  }, [daysKey, targetRow])

  const cols = `64px repeat(${days.length}, minmax(0, 1fr))`

  return (
    <div
      ref={scrollRef}
      className="relative h-[calc(100vh-300px)] min-h-[460px] overflow-auto wide:h-auto wide:min-h-0 wide:flex-1"
    >
      <div className={cn(days.length > 1 && 'min-w-[760px]')}>
        {/* Шапка с днями — прилипает при прокрутке. */}
        <div
          data-grid-header
          className="sticky top-0 z-30 grid border-b border-line bg-surface"
          style={{ gridTemplateColumns: cols }}
        >
          <div className="sticky left-0 z-10 flex items-end justify-end bg-surface pb-2 pr-2 font-mono text-[10px] text-ink-muted">
            GMT+5
          </div>
          {days.map((day) => (
            <DayHead key={day} day={day} today={today} />
          ))}
        </div>

        {ROWS.map((time, r) => {
          const onHour = time.endsWith(':00')
          return (
            <div
              key={time}
              data-row={r}
              className="grid"
              style={{ gridTemplateColumns: cols }}
            >
              {/* Подпись времени — на линии строки, как в календаре Google. */}
              <div className="sticky left-0 z-20 bg-surface pr-2 text-right">
                {r > 0 && (
                  <span
                    className={cn(
                      'relative -top-[7px] font-mono text-[11px] tnum',
                      onHour ? 'text-ink-soft' : 'text-ink-muted/70',
                    )}
                  >
                    {time}
                  </span>
                )}
              </div>

              {days.map((day) => {
                const cellSlots = cells.get(`${day}|${r}`) ?? []
                const weekend = dayOfWeek(day) >= 5
                const nowHere = now && now.date === day && nowRow === r
                return (
                  <div
                    key={day}
                    onPointerMove={nowHere ? trackNow : undefined}
                    onPointerLeave={
                      nowHere ? () => setNowHover(false) : undefined
                    }
                    className={cn(
                      'relative flex min-h-11 flex-col gap-[3px] border-l border-line p-[3px]',
                      // Часовые линии плотнее получасовых.
                      onHour
                        ? 'shadow-[inset_0_1px_0_var(--color-line)]'
                        : 'shadow-[inset_0_1px_0_rgba(11,26,19,0.05)]',
                      weekend && 'bg-paper/50',
                    )}
                  >
                    {canCreate && (
                      <button
                        type="button"
                        onClick={() => onBook(day, time)}
                        aria-label={`Забронировать: ${longDay(day)}, ${time}`}
                        className="group absolute inset-0 z-0 flex items-center justify-center transition-colors hover:bg-indigo-50/70 focus-ring"
                      >
                        <Plus
                          size={15}
                          className="text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                        />
                      </button>
                    )}

                    {cellSlots.map((s) => (
                      <SlotChip key={s.id} slot={s} onOpen={onOpen} />
                    ))}

                    {nowHere && (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -left-px right-0 z-20 h-[2px] bg-danger"
                        style={{ top: `${nowShare * 100}%` }}
                      >
                        {/* Метка выступает за ячейку — ловит наведение сама. */}
                        <span
                          onPointerEnter={() => setNowHover(true)}
                          className="pointer-events-auto absolute -left-[5px] -top-[4px] h-[10px] w-[10px] bg-danger"
                        />
                        <NowTag time={now.time} shown={nowHover} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
