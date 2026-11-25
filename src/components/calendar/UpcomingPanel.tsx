'use client'

import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useOptimistic,
  useRef,
  useTransition,
  type ReactNode,
} from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  EyeOff,
  ListOrdered,
  MoreVertical,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { cn } from '@/lib/cn'
import { useNow } from '@/lib/useNow'
import { addDays, shortDay, shortWeek, startOfWeek } from '@/lib/week'
import { NowTag } from './NowTag'
import { slotLook } from './slotLook'
import { StatusPill } from './StatusPill'
import {
  FEED_MAX_PAGES,
  LIST_PARAMS,
  type CalendarSlot,
  type ListMode,
  type ListPeriod,
} from './types'
import { useCalendarHref } from './useCalendarHref'

interface Props {
  today: string
  /** Что показано: день, неделя или все публикации лентой. */
  period: ListPeriod
  /** Есть ли что догрузить в ленту до и после. */
  moreBefore: boolean
  moreAfter: boolean
  slots: CalendarSlot[]
  onOpen: (slot: CalendarSlot) => void
  onHide: () => void
  /** Без права брони кнопки внизу нет. */
  onBook?: () => void
  canCreate: boolean
  createHint: string
}

const MODES: { id: ListMode; label: string }[] = [
  { id: 'day', label: 'Сегодня' },
  { id: 'week', label: 'Неделя' },
  { id: 'all', label: 'Все' },
]

/** Подписи стрелок: в ленте они прокручивают к соседней дате. */
const ARROWS: Record<ListMode, [string, string]> = {
  day: ['Предыдущий день списка', 'Следующий день списка'],
  week: ['Предыдущая неделя списка', 'Следующая неделя списка'],
  all: ['К предыдущей дате', 'К следующей дате'],
}

const periodLabel = ({ mode, from }: ListPeriod) =>
  mode === 'day'
    ? shortDay(from)
    : mode === 'week'
      ? shortWeek(from)
      : 'Все даты'

/** За сколько пикселей до края ленты грузим следующую порцию. */
const LOAD_AHEAD = 300

const EMPTY: Record<ListMode, string> = {
  day: 'Публикаций в этот день нет',
  week: 'Публикаций на этой неделе нет',
  all: 'Забронированные слоты появятся здесь.',
}

/**
 * Публикации списком по дням: сегодня, неделя или все. День и неделю листают
 * стрелки, «Все» — лента: прокрутка вверх подгружает прошлые даты, вниз —
 * будущие. Красная черта — «сейчас»: выше неё то, что сегодня уже вышло.
 */
export function UpcomingPanel({
  today,
  period,
  moreBefore,
  moreAfter,
  slots,
  onOpen,
  onHide,
  onBook,
  canCreate,
  createHint,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const calendarHref = useCalendarHref()
  const now = useNow()
  const [pending, start] = useTransition()
  const [loading, startLoad] = useTransition()
  // Подпись и кнопки отвечают сразу, список догоняет.
  const [shown, setShown] = useOptimistic(period)
  const listRef = useRef<HTMLDivElement>(null)

  // К черте «сейчас»: над ней остаётся последняя вышедшая публикация.
  const scrollToNow = () => {
    const box = listRef.current
    const line = box?.querySelector<HTMLElement>('[data-now]')
    if (box) box.scrollTop = line ? Math.max(line.offsetTop - 96, 0) : 0
  }
  const ready = now != null
  useEffect(() => {
    if (ready) scrollToNow()
    // Когда браузер узнал время и при смене периода: дальше прокручивает
    // человек.
  }, [ready, period.mode, period.from])

  // Период списка — в адресе: после брони или выплаты список обновится сам.
  const replace = (next: ListPeriod) => {
    const qs = new URLSearchParams(params.toString())
    for (const key of LIST_PARAMS) qs.delete(key)
    if (next.mode === 'all') {
      if (next.up > 1) qs.set('up', String(next.up))
      if (next.down > 1) qs.set('down', String(next.down))
    } else {
      qs.set('list', next.mode)
      if (next.mode === 'week' || next.from !== today) qs.set('from', next.from)
    }
    const query = qs.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }
  const go = (next: ListPeriod) =>
    start(() => {
      setShown(next)
      replace(next)
    })

  // Лента: следующая порция прошлого или будущего.
  const canEarlier = moreBefore && period.up < FEED_MAX_PAGES
  const canLater = moreAfter && period.down < FEED_MAX_PAGES
  const load = (dir: 'up' | 'down') => {
    if (pending || loading) return
    startLoad(() => replace({ ...period, [dir]: period[dir] + 1 }))
  }

  // Первая видимая карточка и её место: по ней возвращаем прокрутку, когда
  // сверху добавились прошлые даты, — список не прыгает под курсором.
  const anchor = useRef<{ id: string; top: number } | null>(null)
  const onScroll = () => {
    const box = listRef.current
    if (!box) return
    const card = [...box.querySelectorAll<HTMLElement>('[data-id]')].find(
      (el) => el.offsetTop + el.offsetHeight > box.scrollTop,
    )
    anchor.current = card
      ? { id: card.dataset.id!, top: card.offsetTop - box.scrollTop }
      : null
    if (canEarlier && box.scrollTop < LOAD_AHEAD) load('up')
    else if (
      canLater &&
      box.scrollHeight - box.scrollTop - box.clientHeight < LOAD_AHEAD
    )
      load('down')
  }
  const firstId = slots[0]?.id
  useLayoutEffect(() => {
    const box = listRef.current
    const at = anchor.current
    const card = at && box?.querySelector<HTMLElement>(`[data-id="${at.id}"]`)
    if (box && card) box.scrollTop = card.offsetTop - at.top
  }, [firstId, canEarlier])
  const pick = (mode: ListMode) => {
    const from = mode === 'week' ? startOfWeek(today) : today
    // Уже открыто — просто вернуть к черте «сейчас».
    if (shown.mode === mode && shown.from === from) scrollToNow()
    else go({ mode, from, up: 1, down: 1 })
  }
  const turn = (dir: 1 | -1) => {
    if (shown.mode !== 'all') {
      const step = shown.mode === 'day' ? 1 : 7
      go({ ...shown, from: addDays(shown.from, dir * step) })
      return
    }
    const box = listRef.current
    if (!box) return
    // Заголовок дня прилипает к верху — допуск в пару пикселей.
    const tops = [...box.querySelectorAll<HTMLElement>('[data-day]')].map(
      (el) => el.offsetTop,
    )
    const next =
      dir === 1
        ? tops.find((top) => top > box.scrollTop + 2)
        : tops.findLast((top) => top < box.scrollTop - 2)
    box.scrollTo({ top: next ?? (dir === 1 ? box.scrollHeight : 0) })
  }

  // Сегодняшний день, если он в периоде, есть всегда — в нём черта «сейчас».
  const hasToday =
    period.from <= today &&
    today <= addDays(period.from, period.mode === 'week' ? 6 : 0)
  const days = new Map<string, CalendarSlot[]>()
  if (hasToday) days.set(today, [])
  for (const s of slots) days.set(s.date, [...(days.get(s.date) ?? []), s])
  const shownDays = [...days].sort(([a], [b]) => (a < b ? -1 : 1))

  return (
    <aside
      aria-label="Публикации списком"
      className="flex max-h-[560px] flex-col border border-line bg-surface wide:absolute wide:inset-0 wide:max-h-none"
    >
      <div className="space-y-2 border-b border-line px-3 py-3">
        <div
          role="group"
          aria-label="Период списка"
          className="flex border border-ink/20"
        >
          {MODES.map((m) => {
            const on =
              shown.mode === m.id && (m.id !== 'day' || shown.from === today)
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => pick(m.id)}
                aria-pressed={on}
                className={cn(
                  'h-9 flex-auto px-1.5 text-[12.5px] font-semibold transition-colors focus-ring',
                  on
                    ? 'bg-forest text-white'
                    : 'text-ink-soft hover:bg-ink/6 hover:text-ink',
                )}
              >
                {m.label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center">
          <Arrow label={ARROWS[shown.mode][0]} onClick={() => turn(-1)}>
            <ChevronLeft size={18} />
          </Arrow>
          <Arrow label={ARROWS[shown.mode][1]} onClick={() => turn(1)}>
            <ChevronRight size={18} />
          </Arrow>
          <p
            aria-live="polite"
            className="min-w-0 flex-1 truncate pl-1.5 text-[13.5px] font-semibold text-ink tnum"
          >
            {periodLabel(shown)}
          </p>
          <DropdownMenu
            trigger={
              <>
                <MoreVertical size={18} aria-hidden="true" />
                <span className="sr-only">Действия с панелью</span>
              </>
            }
            items={[
              {
                label: 'Открыть в «Заказах»',
                icon: ListOrdered,
                onClick: () => router.push('/orders'),
              },
              { label: 'Скрыть панель', icon: EyeOff, onClick: onHide },
            ]}
          />
        </div>
      </div>

      <div
        ref={listRef}
        onScroll={onScroll}
        aria-busy={pending || loading}
        className={cn(
          // Место прокрутки держим сами (anchor) — в Safari браузер не умеет.
          'relative min-h-0 flex-1 space-y-4 overflow-y-auto px-3 pb-3 transition-opacity [overflow-anchor:none]',
          pending && 'opacity-50',
        )}
      >
        {canEarlier && (
          <LoadMore
            label="Показать раньше"
            loading={loading}
            onClick={() => load('up')}
          />
        )}
        {moreBefore && !canEarlier && <FeedEnd label="Более ранние" />}
        {shownDays.map(([day, list]) => {
          const isToday = day === today
          // Сколько сегодняшних публикаций уже вышло — черта встаёт за ними.
          const passed =
            isToday && now?.date === day
              ? list.filter((s) => s.time <= now.time).length
              : -1
          return (
            <section key={day} data-day={day}>
              <h3 className="sticky top-0 z-10 -mx-3 bg-surface px-3 pb-1.5 pt-3">
                <Link
                  href={calendarHref('day', day)}
                  title="Открыть день"
                  className={cn(
                    'text-[12.5px] font-semibold underline-offset-2 hover:underline focus-ring',
                    isToday ? 'text-indigo-600' : 'text-ink-soft',
                  )}
                >
                  {shortDay(day)}
                  {isToday && ' · сегодня'}
                </Link>
              </h3>
              <ul className="space-y-1.5">
                {list.map((s, i) => (
                  <Fragment key={s.id}>
                    {i === passed && <NowLine time={now?.time} />}
                    <li data-id={s.id}>
                      <Card
                        slot={s}
                        passed={day < today || i < passed}
                        onOpen={() => onOpen(s)}
                      />
                    </li>
                  </Fragment>
                ))}
                {passed === list.length && <NowLine time={now?.time} />}
                {list.length === 0 && (
                  <li className="text-[13px] text-ink-muted">
                    Публикаций сегодня нет
                  </li>
                )}
              </ul>
            </section>
          )
        })}
        {slots.length === 0 && !(hasToday && period.mode === 'day') && (
          <p className="pt-3 text-[13px] text-ink-muted">
            {EMPTY[period.mode]}
          </p>
        )}
        {canLater && (
          <LoadMore
            label="Показать дальше"
            loading={loading}
            onClick={() => load('down')}
          />
        )}
        {moreAfter && !canLater && <FeedEnd label="Более поздние" />}
      </div>

      {onBook && (
        <div className="border-t border-line p-3">
          <Button
            variant="secondary"
            onClick={onBook}
            disabled={!canCreate}
            title={!canCreate ? createHint : undefined}
            className="w-full"
          >
            <Plus size={17} />
            Забронировать слот
          </Button>
        </div>
      )}
    </aside>
  )
}

/** Запасной путь к подгрузке: с клавиатуры и когда прокручивать нечего. */
function LoadMore({
  label,
  loading,
  onClick,
}: {
  label: string
  loading: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="mt-3 h-8 w-full text-[12.5px] font-semibold text-ink-muted transition-colors hover:text-ink focus-ring"
    >
      {loading ? 'Загружаем…' : label}
    </button>
  )
}

function FeedEnd({ label }: { label: string }) {
  return (
    <p className="pt-3 text-center text-[12.5px] text-ink-muted">
      {label} — в{' '}
      <Link
        href="/orders?status=all&month=all"
        className="font-semibold text-indigo-600 underline-offset-2 hover:underline focus-ring"
      >
        «Заказах»
      </Link>
    </p>
  )
}

function Arrow({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-9 w-9 shrink-0 items-center justify-center text-ink-soft transition-colors hover:bg-ink/6 hover:text-ink focus-ring"
    >
      {children}
    </button>
  )
}

/** Карточка в цвете формата: кампания, время и формат. */
function Card({
  slot,
  passed,
  onOpen,
}: {
  slot: CalendarSlot
  passed: boolean
  onOpen: () => void
}) {
  const look = slotLook(slot.color, false, passed)
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        '@container block w-full px-2.5 py-2 text-left transition-[filter] hover:brightness-95 focus-ring',
        look.className,
      )}
      style={look.style}
    >
      <span className="block truncate text-[13px] font-semibold leading-snug">
        {slot.campaignName || slot.formatName}
      </span>
      <span className="mt-0.5 block truncate text-[12px]">
        <span className="tnum">{slot.time}</span> · {slot.formatName}
      </span>
      <span className="mt-1 flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-[11.5px]">
          {slot.advertiserName}
        </span>
        <StatusPill status={slot.status} />
      </span>
    </button>
  )
}

/** Черта «сейчас»; при наведении на неё или рядом — текущее время. */
function NowLine({ time }: { time?: string }) {
  return (
    <li
      data-now
      aria-hidden="true"
      className="group relative ml-1 h-[2px] bg-danger before:absolute before:-inset-y-1.5 before:inset-x-0"
    >
      <span className="absolute -left-[4px] -top-[4px] h-[10px] w-[10px] bg-danger" />
      {time && <NowTag time={time} className="z-10 group-hover:opacity-100" />}
    </li>
  )
}
