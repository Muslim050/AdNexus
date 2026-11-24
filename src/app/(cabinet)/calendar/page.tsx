import { Suspense } from 'react'
import type { Metadata } from 'next'
import { CalendarView } from '@/components/calendar/CalendarView'
import { FEED_MAX_PAGES, type ListPeriod } from '@/components/calendar/types'
import { PageHeader } from '@/components/PageHeader'
import { Loader } from '@/components/ui/Loader'
import { requireSection } from '@/lib/auth'
import { advertiserOptions } from '@/lib/data/advertisers'
import {
  bookingsBetween,
  feedBookings,
  managerOptions,
  listedBookings,
} from '@/lib/data/bookings'
import { contractOptions } from '@/lib/data/contracts'
import { formatOptions } from '@/lib/data/formats'
import { addDays, isIsoDate, startOfWeek, todayTashkent } from '@/lib/week'
import { isEditor } from '@/lib/roles'

export const metadata: Metadata = { title: 'Календарь публикаций' }

/**
 * Режим и дата задаются адресом: /calendar?d=2026-11-19 — неделя,
 * /calendar?view=day&d=2026-11-19 — день. Период списка справа — отдельно:
 * list=day|week и from=2026-11-19; без list — все публикации лентой, up и
 * down — сколько её порций загружено до сегодня и после.
 */
export default function Page({ searchParams }: PageProps<'/calendar'>) {
  return (
    <>
      <PageHeader
        title="Календарь публикаций"
        subtitle="Бронирование временных слотов."
      />
      <Suspense fallback={<Loader />}>
        <Calendar searchParams={searchParams} />
      </Suspense>
    </>
  )
}

const feedPages = (raw: string | string[] | undefined) =>
  Math.min(Math.max(Math.trunc(Number(raw)) || 1, 1), FEED_MAX_PAGES)

async function Calendar({
  searchParams,
}: Pick<PageProps<'/calendar'>, 'searchParams'>) {
  const user = await requireSection('/calendar')
  const { d, view: rawView, list, from: rawFrom, up, down } = await searchParams
  const view = rawView === 'day' ? 'day' : 'week'
  const today = todayTashkent()
  const anchor = isIsoDate(d) ? d : today
  const weekStart = startOfWeek(anchor)
  const canManage = isEditor(user.role)
  const canBook = canManage || user.role === 'advertiser'
  const [from, to] =
    view === 'day' ? [anchor, anchor] : [weekStart, addDays(weekStart, 6)]

  const listFrom = isIsoDate(rawFrom) ? rawFrom : today
  const listMode = list === 'day' || list === 'week' ? list : 'all'
  const period: ListPeriod = {
    mode: listMode,
    from: { day: listFrom, week: startOfWeek(listFrom), all: today }[listMode],
    up: feedPages(up),
    down: feedPages(down),
  }

  const [slots, listed, formats, managers, advertisers, contracts] =
    await Promise.all([
      bookingsBetween(from, to),
      period.mode === 'all'
        ? feedBookings(today, period.up, period.down)
        : listedBookings(
            period.from,
            period.mode === 'week' ? addDays(period.from, 6) : period.from,
          ),
      formatOptions(),
      canManage ? managerOptions() : Promise.resolve([]),
      canBook ? advertiserOptions() : Promise.resolve([]),
      canBook ? contractOptions() : Promise.resolve([]),
    ])

  return (
    <CalendarView
      view={view}
      anchor={anchor}
      weekStart={weekStart}
      today={today}
      slots={slots.map((s) => ({ ...s, createdAt: undefined }))}
      period={period}
      listed={listed.rows}
      moreBefore={listed.moreBefore}
      moreAfter={listed.moreAfter}
      formats={formats}
      managers={managers}
      advertisers={advertisers}
      contracts={contracts}
      role={user.role}
      currentUserId={user.id}
    />
  )
}
