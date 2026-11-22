import type { Metadata } from 'next'
import { CalendarView } from '@/components/calendar/CalendarView'
import { PageHeader } from '@/components/PageHeader'
import { requireSection } from '@/lib/auth'
import { bookingsBetween, managerOptions } from '@/lib/data/bookings'
import { formatOptions } from '@/lib/data/formats'
import { addDays, isIsoDate, startOfWeek, todayTashkent } from '@/lib/week'

export const metadata: Metadata = { title: 'Календарь размещений' }

/**
 * Режим и дата задаются адресом: /calendar?d=2026-11-19 — неделя,
 * /calendar?view=day&d=2026-11-19 — день.
 */
export default async function Page({ searchParams }: PageProps<'/calendar'>) {
  const user = await requireSection('/calendar')
  const { d, view: rawView } = await searchParams
  const view = rawView === 'day' ? 'day' : 'week'
  const today = todayTashkent()
  const anchor = isIsoDate(d) ? d : today
  const weekStart = startOfWeek(anchor)
  const canBook = user.role === 'admin'
  const [from, to] =
    view === 'day' ? [anchor, anchor] : [weekStart, addDays(weekStart, 6)]

  const [slots, formats, managers] = await Promise.all([
    bookingsBetween(from, to),
    formatOptions(),
    canBook ? managerOptions() : Promise.resolve([]),
  ])

  return (
    <>
      <PageHeader
        title="Календарь размещений"
        subtitle="Бронирование временных слотов."
      />
      <CalendarView
        view={view}
        anchor={anchor}
        weekStart={weekStart}
        today={today}
        slots={slots.map((s) => ({ ...s, createdAt: undefined }))}
        formats={formats}
        managers={managers}
        canBook={canBook}
        currentUserId={user.id}
      />
    </>
  )
}
