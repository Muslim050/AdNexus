import type { BookingStatus } from '@/lib/bookings'
import type { BookingFact } from '@/lib/facts'
import type { AttachedFile } from '@/lib/files'

export interface CalendarSlot {
  id: string
  date: string
  time: string
  status: BookingStatus
  /** Сумма публикации и оплачено — decimal-строки. */
  amount: string
  paid: string
  payments: BookingPayment[]
  /** Чужой слот для рекламодателя: видно только, что он занят. */
  masked: boolean
  campaignName: string
  comment: string
  file: AttachedFile | null
  createdBy: string
  formatId: string
  formatName: string
  color: string
  managerId: string | null
  managerName: string | null
  advertiserId: string | null
  contractId: string | null
  advertiserName: string | null
  advertiserLogo: AttachedFile | null
  advertiserColor: string | null
  /** Показы по плану — из формата. */
  planImpressions: number
  fact: BookingFact | null
  contractNumber: string | null
  contractDiscount: string | null
  contractStart: string | null
  contractEnd: string | null
  contractFile: AttachedFile | null
}

export interface BookingPayment {
  id: string
  amount: string
  /** ISO-время оплаты. */
  paidAt: string
  comment: string
  createdBy: string
}

export type CalendarView = 'week' | 'day'

/** Подпись слота: «10:30 | Айша | Post Instagram uzb | Зимняя кампания». */
export const slotLabel = (s: CalendarSlot) =>
  s.masked
    ? `${s.time} | Занято | ${s.formatName}`
    : [s.time, s.managerName ?? 'Без менеджера', s.formatName, s.campaignName]
        .filter(Boolean)
        .join(' | ')

/** Список справа: день, неделя или все публикации лентой. */
export type ListMode = 'day' | 'week' | 'all'
export interface ListPeriod {
  mode: ListMode
  /** Первый день дня или недели; у ленты — сегодня. */
  from: string
  /** Сколько порций ленты загружено до сегодня и после. */
  up: number
  down: number
}

/** Параметры адреса, которыми живёт список: сетка их не сбрасывает. */
export const LIST_PARAMS = ['list', 'from', 'up', 'down'] as const

/** Дальше лента не грузится: за остальным — в «Заказы». */
export const FEED_MAX_PAGES = 20

export const calendarHref = (
  view: CalendarView,
  date?: string,
  list?: Iterable<[string, string]>,
) => {
  const params = new URLSearchParams()
  if (view === 'day') params.set('view', 'day')
  if (date) params.set('d', date)
  for (const [key, value] of list ?? []) params.set(key, value)
  const qs = params.toString()
  return qs ? `/calendar?${qs}` : '/calendar'
}
