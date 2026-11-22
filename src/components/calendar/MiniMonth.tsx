'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  MONTHS,
  WEEKDAYS_MINI,
  dayOfMonth,
  monthGrid,
  monthIndex,
  yearOf,
} from '@/lib/week'

/** Мини-календарь месяца: клик по дню открывает его неделю. */
export function MiniMonth({
  weekStart,
  today,
}: {
  weekStart: string
  today: string
}) {
  const [cursor, setCursor] = useState(() => ({
    year: yearOf(weekStart),
    month: monthIndex(weekStart),
  }))

  const shift = (delta: number) =>
    setCursor(({ year, month }) => {
      const m = month + delta
      return { year: year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 }
    })

  const grid = monthGrid(cursor.year, cursor.month)

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="font-display text-[14px] font-bold text-ink">
          {MONTHS[cursor.month]} {cursor.year}
        </p>
        <div className="flex">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label="Предыдущий месяц"
            className="flex h-7 w-7 items-center justify-center text-ink-muted hover:bg-ink/6 hover:text-ink focus-ring"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label="Следующий месяц"
            className="flex h-7 w-7 items-center justify-center text-ink-muted hover:bg-ink/6 hover:text-ink focus-ring"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center">
        {WEEKDAYS_MINI.map((d) => (
          <span
            key={d}
            className="py-1 text-[10.5px] font-semibold text-ink-muted"
          >
            {d}
          </span>
        ))}
        {grid.map((week) => {
          const current = week[0] === weekStart
          return week.map((day, i) => {
            const outside = monthIndex(day) !== cursor.month
            const isToday = day === today
            return (
              <Link
                key={day}
                href={`/calendar?d=${day}`}
                className={cn(
                  'relative flex h-8 items-center justify-center text-[12px] tnum transition-colors focus-ring',
                  current && 'bg-indigo-50',
                  current &&
                    i === 0 &&
                    'shadow-[inset_2px_0_0_var(--color-indigo-500)]',
                  outside ? 'text-ink-muted/60' : 'text-ink',
                  !isToday && 'hover:bg-ink/6',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center',
                    isToday && 'bg-indigo-500 font-bold text-white',
                  )}
                >
                  {dayOfMonth(day)}
                </span>
              </Link>
            )
          })
        })}
      </div>
    </div>
  )
}
