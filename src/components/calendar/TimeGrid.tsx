'use client'

import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown, Plus } from 'lucide-react'
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

/** Ночь, 00:00–07:00: пустую сворачиваем в одну строку. */
const NIGHT_ROWS = 14

/** Слоты за краем сетки: сколько, время ближайшего и его строка. */
interface Beyond {
  count: number
  time: string
  row: number
}
interface Hidden {
  above: Beyond | null
  below: Beyond | null
}

interface Props {
  days: string[]
  today: string
  slots: CalendarSlot[]
  /** Рекламодатель видит только свои слоты — бренд в подписи лишний. */
  ownBrand: boolean
  canCreate: boolean
  onBook: (date: string, time: string) => void
  onOpen: (slot: CalendarSlot) => void
}

/**
 * Сетка дня или недели по времени: строка — полчаса, подписи 13:00, 13:30…
 * Слоты встают в строку своего получаса; когда их много, строка растёт.
 * Красная полоса — текущее время по Ташкенту. Пустая ночь свёрнута, а брони
 * за краем сетки считает плашка: клик прокручивает к ближайшей.
 */
export function TimeGrid({
  days,
  today,
  slots,
  ownBrand,
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

  // Ночь разворачивается сама, если в ней есть бронь или «сейчас».
  const [nightOpen, setNightOpen] = useState(false)
  const nightBusy =
    slots.some((s) => rowOf(s.time) < NIGHT_ROWS) ||
    (showsToday && nowRow != null && nowRow < NIGHT_ROWS)
  const firstShown = nightOpen || nightBusy ? 0 : NIGHT_ROWS

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
    if (!box) return
    const row = box.querySelector<HTMLElement>(`[data-row="${targetRow}"]`)
    const header = box.querySelector<HTMLElement>('[data-grid-header]')
    box.scrollTop = row ? row.offsetTop - (header?.offsetHeight ?? 0) : 0
    // На телефоне неделя шире экрана — сегодняшний день ставим первым.
    const head = box.querySelector<HTMLElement>('[data-today]')
    const corner = header?.firstElementChild as HTMLElement | null
    box.scrollLeft = head ? head.offsetLeft - (corner?.offsetWidth ?? 0) : 0
    // Прокручиваем при смене недели/дня и когда «сейчас» стало известно.
  }, [daysKey, targetRow])

  // Что осталось за краем: сравниваем строки слотов с видимой полосой.
  const [beyond, setBeyond] = useState<Hidden>({ above: null, below: null })
  useEffect(() => {
    const box = scrollRef.current
    if (!box) return
    const measure = () => {
      const header = box.querySelector<HTMLElement>('[data-grid-header]')
      const top = box.scrollTop + (header?.offsetHeight ?? 0)
      const bottom = box.scrollTop + box.clientHeight
      const next: Hidden = { above: null, below: null }
      for (const slot of slots) {
        const row = rowOf(slot.time)
        const el = box.querySelector<HTMLElement>(`[data-row="${row}"]`)
        if (!el) continue
        // Строка за краем, когда её середины не видно.
        const middle = el.offsetTop + el.offsetHeight / 2
        const side =
          middle < top ? 'above' : middle > bottom ? 'below' : undefined
        if (!side) continue
        const seen = next[side]
        // Ближайшая к краю: сверху — самая поздняя, снизу — самая ранняя.
        const nearer =
          !seen ||
          (side === 'above' ? slot.time > seen.time : slot.time < seen.time)
        next[side] = {
          count: (seen?.count ?? 0) + 1,
          time: nearer ? slot.time : seen.time,
          row: nearer ? row : seen.row,
        }
      }
      setBeyond((prev) =>
        JSON.stringify(prev) === JSON.stringify(next) ? prev : next,
      )
    }
    measure()
    const resize = new ResizeObserver(measure)
    resize.observe(box)
    box.addEventListener('scroll', measure, { passive: true })
    return () => {
      resize.disconnect()
      box.removeEventListener('scroll', measure)
    }
  }, [slots, firstShown])

  const scrollToRow = (row: number) => {
    const box = scrollRef.current
    const el = box?.querySelector<HTMLElement>(`[data-row="${row}"]`)
    if (!box || !el) return
    const header = box.querySelector<HTMLElement>('[data-grid-header]')
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Соседняя строка сверху остаётся видна — понятно, куда приехали.
    box.scrollTo({
      top: el.offsetTop - (header?.offsetHeight ?? 0) - el.offsetHeight,
      behavior: calm ? 'auto' : 'smooth',
    })
  }

  const cols = `64px repeat(${days.length}, minmax(0, 1fr))`

  return (
    <div className="relative wide:flex wide:min-h-0 wide:flex-1 wide:flex-col">
      <div
        ref={scrollRef}
        className="relative h-[calc(100dvh-300px)] min-h-[460px] overflow-auto wide:h-auto wide:min-h-0 wide:flex-1"
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

          {!nightBusy && (
            <button
              type="button"
              onClick={() => setNightOpen((open) => !open)}
              aria-expanded={nightOpen}
              className="sticky left-0 flex h-9 w-full items-center gap-2 border-b border-line bg-hatch px-3 text-left text-[12px] font-semibold text-ink-muted transition-colors hover:text-ink focus-ring"
            >
              <ChevronsUpDown size={14} aria-hidden="true" />
              {nightOpen ? 'Свернуть ночь' : 'Ночь, 00:00–07:00, без броней'}
            </button>
          )}

          {ROWS.slice(firstShown).map((time, i) => {
            const r = i + firstShown
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
                  {i > 0 && (
                    <span
                      className={cn(
                        'relative -top-[7px] font-mono text-[11px] tnum',
                        onHour ? 'text-ink-soft' : 'text-ink-muted',
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
                        <SlotChip
                          key={s.id}
                          slot={s}
                          ownBrand={ownBrand}
                          onOpen={onOpen}
                        />
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
      <BeyondTag side="above" beyond={beyond.above} onPick={scrollToRow} />
      <BeyondTag side="below" beyond={beyond.below} onPick={scrollToRow} />
    </div>
  )
}

/** Плашка у края сетки: сколько броней не видно и где ближайшая. */
function BeyondTag({
  side,
  beyond,
  onPick,
}: {
  side: 'above' | 'below'
  beyond: Beyond | null
  onPick: (row: number) => void
}) {
  if (!beyond) return null
  const Icon = side === 'above' ? ArrowUp : ArrowDown
  return (
    <button
      type="button"
      onClick={() => onPick(beyond.row)}
      className={cn(
        'absolute left-1/2 z-30 flex h-8 -translate-x-1/2 items-center gap-1.5 whitespace-nowrap bg-forest px-3 text-[12px] font-semibold text-white shadow-lift transition-colors hover:bg-forest-soft focus-ring',
        // Под шапкой с днями, чтобы её не закрыть.
        side === 'above' ? 'top-[92px]' : 'bottom-4',
      )}
    >
      <Icon size={14} aria-hidden="true" />
      {side === 'above' ? 'Выше' : 'Ниже'}: {beyond.count}{' '}
      {plural(beyond.count)}
      <span className="font-normal text-white/70 tnum">
        {side === 'above' ? 'до' : 'с'} {beyond.time}
      </span>
    </button>
  )
}

const plural = (n: number) =>
  n % 10 === 1 && n % 100 !== 11
    ? 'бронь'
    : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)
      ? 'брони'
      : 'броней'
