import type { Metadata } from 'next'
import { PageHeader } from '@/components/PageHeader'
import { OrdersView } from '@/components/orders/OrdersView'
import { requireSection } from '@/lib/auth'
import { isBookingStatus } from '@/lib/bookings'
import { advertiserOptions } from '@/lib/data/advertisers'
import { managerOptions } from '@/lib/data/bookings'
import { contractOptions } from '@/lib/data/contracts'
import { formatOptions } from '@/lib/data/formats'
import {
  ORDERS_PAGE_SIZE,
  listOrders,
  type OrdersFilter,
} from '@/lib/data/orders'
import { todayTashkent } from '@/lib/week'

export const metadata: Metadata = { title: 'Заказы и медиапланы' }

/**
 * Список размещений. Фильтры живут в адресе:
 * ?status=sent&month=2026-11&format=…&q=…&page=2
 */
export default async function Page({ searchParams }: PageProps<'/orders'>) {
  const user = await requireSection('/orders')
  const sp = await searchParams
  const one = (k: string) => {
    const v = sp[k]
    return (Array.isArray(v) ? v[0] : v) ?? ''
  }

  const rawStatus = one('status')
  const status: OrdersFilter =
    rawStatus === 'all' || isBookingStatus(rawStatus) ? rawStatus : 'upcoming'
  const today = todayTashkent()
  const currentMonth = today.slice(0, 7)
  const rawMonth = one('month')
  const period =
    rawMonth === 'all' || /^\d{4}-(0[1-9]|1[0-2])$/.test(rawMonth)
      ? rawMonth
      : currentMonth
  const q = one('q').slice(0, 100)
  const formatId = /^[0-9a-f-]{36}$/.test(one('format')) ? one('format') : ''
  const page = Math.max(1, Number(one('page')) || 1)

  const isAdmin = user.role === 'admin'
  const canBook = isAdmin || user.role === 'advertiser'
  const [list, formats, managers, advertisers, contracts] = await Promise.all([
    listOrders({
      status,
      // Поиск — по всем месяцам.
      month: q || period === 'all' ? undefined : period,
      formatId: formatId || undefined,
      q: q || undefined,
      page,
    }),
    formatOptions(),
    isAdmin ? managerOptions() : Promise.resolve([]),
    canBook ? advertiserOptions() : Promise.resolve([]),
    canBook ? contractOptions() : Promise.resolve([]),
  ])

  return (
    <>
      <PageHeader
        title="Заказы и медиапланы"
        subtitle="Размещения брендов: оплаты и статусы. Нажмите на строку, чтобы открыть карточку."
      />
      <OrdersView
        rows={list.rows}
        total={list.total}
        page={page}
        pageSize={ORDERS_PAGE_SIZE}
        counts={list.counts}
        query={{ status, formatId, q, period }}
        currentMonth={currentMonth}
        today={today}
        stats={list.stats}
        formats={formats}
        managers={managers}
        advertisers={advertisers}
        contracts={contracts}
        role={user.role}
        currentUserId={user.id}
      />
    </>
  )
}
