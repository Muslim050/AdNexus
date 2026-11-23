'use client'

import { Fragment, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EyeOff, ListOrdered, MoreVertical, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { cn } from '@/lib/cn'
import { useNow } from '@/lib/useNow'
import { shortDay } from '@/lib/week'
import { slotLook } from './slotLook'
import { StatusPill } from './StatusPill'
import {
  calendarHref,
  type CalendarSlot,
  type CalendarView as View,
} from './types'

interface Props {
  view: View
  today: string
  slots: CalendarSlot[]
  onOpen: (slot: CalendarSlot) => void
  onHide: () => void
  /** Без права брони кнопки внизу нет. */
  onBook?: () => void
  canCreate: boolean
  createHint: string
}

/**
 * Ближайшие публикации списком по дням, от сегодняшнего. Красная черта —
 * «сейчас»: выше неё то, что сегодня уже вышло.
 */
export function UpcomingPanel({
  view,
  today,
  slots,
  onOpen,
  onHide,
  onBook,
  canCreate,
  createHint,
}: Props) {
  const router = useRouter()
  const now = useNow()
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
    // Один раз, когда браузер узнал время: дальше прокручивает человек.
  }, [ready])

  // Сегодняшний день есть всегда — в нём черта «сейчас».
  const days = new Map<string, CalendarSlot[]>([[today, []]])
  for (const s of slots) days.set(s.date, [...(days.get(s.date) ?? []), s])

  return (
    <aside
      aria-label="Ближайшие публикации"
      className="flex max-h-[560px] flex-col border border-line bg-surface min-[82.5rem]:absolute min-[82.5rem]:inset-0 min-[82.5rem]:max-h-none"
    >
      <div className="flex items-center gap-2 border-b border-line px-3 py-3">
        <Link
          href={calendarHref(view)}
          onClick={scrollToNow}
          className="flex h-9 items-center border border-ink/20 px-4 text-[13px] font-semibold text-ink transition-colors hover:border-ink focus-ring"
        >
          Сегодня
        </Link>
        <span className="eyebrow min-w-0 truncate text-ink-muted">
          Ближайшие
        </span>
        <div className="ml-auto">
          <DropdownMenu
            trigger={
              <>
                <MoreVertical size={18} aria-hidden="true" />
                <span className="sr-only">Действия с панелью</span>
              </>
            }
            items={[
              {
                label: 'Все публикации',
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
        className="relative min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-3"
      >
        {[...days].map(([day, list]) => {
          const isToday = day === today
          // Сколько сегодняшних публикаций уже вышло — черта встаёт за ними.
          const passed =
            isToday && now?.date === day
              ? list.filter((s) => s.time <= now.time).length
              : -1
          return (
            <section key={day}>
              <h3 className="mb-1.5">
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
                    {i === passed && <NowLine />}
                    <li>
                      <Card
                        slot={s}
                        passed={i < passed}
                        onOpen={() => onOpen(s)}
                      />
                    </li>
                  </Fragment>
                ))}
                {passed === list.length && <NowLine />}
                {list.length === 0 && (
                  <li className="text-[13px] text-ink-muted">
                    Публикаций сегодня нет
                  </li>
                )}
              </ul>
            </section>
          )
        })}
        {slots.length === 0 && (
          <p className="text-[13px] text-ink-muted">
            Забронированные слоты появятся здесь.
          </p>
        )}
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
  const look = slotLook(slot.color, false)
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        '@container block w-full px-2.5 py-2 text-left transition-[filter] hover:brightness-95 focus-ring',
        passed && 'opacity-65',
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
        <span className="min-w-0 flex-1 truncate text-[11.5px] opacity-80">
          {slot.advertiserName}
        </span>
        <StatusPill status={slot.status} />
      </span>
    </button>
  )
}

function NowLine() {
  return (
    <li data-now aria-hidden="true" className="relative ml-1 h-[2px] bg-danger">
      <span className="absolute -left-[4px] -top-[4px] h-[10px] w-[10px] bg-danger" />
    </li>
  )
}
