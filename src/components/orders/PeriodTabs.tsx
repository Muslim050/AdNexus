'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

const MONTHS = [
  'Янв',
  'Фев',
  'Мар',
  'Апр',
  'Май',
  'Июн',
  'Июл',
  'Авг',
  'Сен',
  'Окт',
  'Ноя',
  'Дек',
]
/** Месяц списка и год со стрелками; «Все» держит год в поле зрения. */
export function PeriodTabs({
  period,
  currentMonth,
  onPick,
  action,
}: {
  period: string
  currentMonth: string
  onPick: (period: string) => void
  /** Кнопка раздела: на телефоне рядом с годом, на широком экране — в конце. */
  action?: ReactNode
}) {
  const shown = period === 'all' ? currentMonth : period
  const year = Number(shown.slice(0, 4))
  const strip = useRef<HTMLDivElement>(null)

  // На телефоне полоса едет вбок — держим выбранный месяц на виду.
  useEffect(() => {
    const box = strip.current
    const on = box?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (box && on)
      box.scrollLeft = on.offsetLeft - (box.clientWidth - on.offsetWidth) / 2
  }, [period])

  const tab = (on: boolean) =>
    cn(
      'h-8 shrink-0 px-3 text-[13px] font-semibold transition-colors focus-ring sm:flex-1 sm:px-1',
      on
        ? 'bg-forest text-white'
        : 'text-ink-soft hover:bg-ink/6 hover:text-ink',
    )

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 lg:flex-nowrap">
      <div className="inline-flex w-fit shrink-0 items-center border border-line bg-surface p-1">
        <button
          type="button"
          aria-label="Предыдущий год"
          onClick={() => onPick(`${year - 1}${shown.slice(4)}`)}
          className="flex h-8 w-8 items-center justify-center text-ink-soft hover:bg-ink/6 hover:text-ink focus-ring"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="w-12 text-center font-mono text-[13px] font-semibold tnum">
          {year}
        </span>
        <button
          type="button"
          aria-label="Следующий год"
          onClick={() => onPick(`${year + 1}${shown.slice(4)}`)}
          className="flex h-8 w-8 items-center justify-center text-ink-soft hover:bg-ink/6 hover:text-ink focus-ring"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div
        ref={strip}
        role="group"
        aria-label="Месяц"
        className="no-scrollbar order-last flex w-full min-w-0 gap-0.5 overflow-x-auto border border-line bg-surface p-1 lg:order-none lg:w-auto lg:flex-1"
      >
        <button
          type="button"
          aria-pressed={period === 'all'}
          onClick={() => onPick('all')}
          className={tab(period === 'all')}
        >
          Все
        </button>
        {MONTHS.map((label, i) => {
          const id = `${year}-${String(i + 1).padStart(2, '0')}`
          return (
            <button
              key={id}
              type="button"
              aria-pressed={period === id}
              onClick={() => onPick(id)}
              className={tab(period === id)}
            >
              {label}
            </button>
          )
        })}
      </div>
      {action && <div className="ml-auto shrink-0">{action}</div>}
    </div>
  )
}
