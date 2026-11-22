import type { BadgeTone } from '@/components/ui/Badge'

/** Статусы брони — в порядке воронки. Меняет только admin. */
export const BOOKING_STATUSES = [
  'sent',
  'received',
  'reviewing',
  'active',
  'completed',
] as const
export type BookingStatus = (typeof BOOKING_STATUSES)[number]

export const BOOKING_STATUS: Record<
  BookingStatus,
  { label: string; tone: BadgeTone; dot: string }
> = {
  sent: { label: 'Отправлен', tone: 'indigo', dot: '#1E6FD9' },
  received: { label: 'Получен', tone: 'muted', dot: '#546E7A' },
  reviewing: { label: 'Рассматривается', tone: 'warning', dot: '#C77800' },
  active: { label: 'Активен', tone: 'success', dot: '#12894C' },
  completed: { label: 'Выполнен', tone: 'muted', dot: '#75827B' },
}

export const isBookingStatus = (v: unknown): v is BookingStatus =>
  BOOKING_STATUSES.includes(v as BookingStatus)
