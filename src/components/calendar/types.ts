import type { BookingStatus } from '@/lib/bookings'
import type { AttachedFile } from '@/lib/files'

export interface CalendarSlot {
  id: string
  date: string
  time: string
  status: BookingStatus
  /** Сумма размещения и оплачено — decimal-строки. */
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

export const calendarHref = (view: CalendarView, date?: string) => {
  const params = new URLSearchParams()
  if (view === 'day') params.set('view', 'day')
  if (date) params.set('d', date)
  const qs = params.toString()
  return qs ? `/calendar?${qs}` : '/calendar'
}
