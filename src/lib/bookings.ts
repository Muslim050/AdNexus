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
  { label: string; tone: BadgeTone }
> = {
  sent: { label: 'Отправлен', tone: 'indigo' },
  received: { label: 'Получен', tone: 'muted' },
  reviewing: { label: 'Рассматривается', tone: 'warning' },
  active: { label: 'Активен', tone: 'success' },
  completed: { label: 'Выполнен', tone: 'muted' },
}

export const isBookingStatus = (v: unknown): v is BookingStatus =>
  BOOKING_STATUSES.includes(v as BookingStatus)
