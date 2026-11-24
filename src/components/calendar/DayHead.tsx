'use client'

import Link from 'next/link'
import { cn } from '@/lib/cn'
import { WEEKDAYS, dayOfMonth, dayOfWeek } from '@/lib/week'
import { useCalendarHref } from './useCalendarHref'

/** День в шапке сетки: клик открывает его. */
export function DayHead({ day, today }: { day: string; today: string }) {
  const calendarHref = useCalendarHref()
  const isToday = day === today
  return (
    <Link
      href={calendarHref('day', day)}
      title="Открыть день"
      className="group flex flex-col items-center gap-1 border-l border-line py-2.5 focus-ring"
    >
      <span
        className={cn(
          'font-mono text-[10.5px] font-semibold tracking-wider',
          isToday ? 'text-indigo-600' : 'text-ink-muted',
        )}
      >
        {WEEKDAYS[dayOfWeek(day)]}
      </span>
      <span
        className={cn(
          'flex h-10 w-10 items-center justify-center font-display text-[22px] font-semibold tnum transition-colors',
          isToday
            ? 'bg-indigo-500 text-white'
            : 'text-ink group-hover:bg-ink/6',
        )}
      >
        {dayOfMonth(day)}
      </span>
    </Link>
  )
}
