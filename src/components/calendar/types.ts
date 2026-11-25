import { BOOKING_STATUS, type BookingStatus } from '@/lib/bookings'
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

/**
 * Чья публикация — подпись слота после времени: «Artel · Зимняя кампания».
 * Рекламодатель видит только своё, поэтому бренд ему не повторяем.
 */
export const slotText = (s: CalendarSlot, ownBrand = false) =>
  s.masked
    ? 'Занято'
    : [!ownBrand && s.advertiserName, s.campaignName]
        .filter(Boolean)
        .join(' · ') || s.formatName

/** Всё о слоте одной строкой — подсказка при наведении. */
export const slotTitle = (s: CalendarSlot) =>
  [
    s.time,
    slotText(s),
    s.formatName,
    s.managerName ?? 'Менеджер не назначен',
    BOOKING_STATUS[s.status].label,
  ].join(' · ')

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
  // Режим — в адресе всегда: без него телефон откроет день, а не неделю.
  const params = new URLSearchParams({ view })
  if (date) params.set('d', date)
  for (const [key, value] of list ?? []) params.set(key, value)
  return `/calendar?${params}`
}
