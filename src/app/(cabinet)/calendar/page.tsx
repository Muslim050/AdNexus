import type { Metadata } from 'next'
import { CalendarView } from '@/components/calendar/CalendarView'
import { PageHeader } from '@/components/PageHeader'
import { requireSection } from '@/lib/auth'
import { bookingsBetween, managerOptions } from '@/lib/data/bookings'
import { formatOptions } from '@/lib/data/formats'
import { addDays, isIsoDate, startOfWeek, todayTashkent } from '@/lib/week'

export const metadata: Metadata = { title: 'Календарь размещений' }

/** Неделя календаря задаётся адресом: /calendar?d=2026-11-19. */
export default async function Page({ searchParams }: PageProps<'/calendar'>) {
  const user = await requireSection('/calendar')
  const { d } = await searchParams
  const today = todayTashkent()
  const weekStart = startOfWeek(isIsoDate(d) ? d : today)
  const canBook = user.role === 'admin'

  const [slots, formats, managers] = await Promise.all([
    bookingsBetween(weekStart, addDays(weekStart, 6)),
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
