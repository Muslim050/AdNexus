import {
  CheckCheck,
  Eye,
  Inbox,
  Play,
  Send,
  type LucideIcon,
} from 'lucide-react'
import { BOOKING_STATUS, type BookingStatus } from '@/lib/bookings'
import { cn } from '@/lib/cn'

export const STATUS_ICON: Record<BookingStatus, LucideIcon> = {
  sent: Send,
  received: Inbox,
  reviewing: Eye,
  active: Play,
  completed: CheckCheck,
}

/**
 * Значок статуса: белая плашка с иконкой цвета статуса. На любой заливке
 * формата читается одинаково — цвет формата остаётся как в справочнике.
 */
export function StatusIcon({
  status,
  size = 'sm',
  className,
}: {
  status: BookingStatus
  size?: 'sm' | 'md'
  className?: string
}) {
  const Icon = STATUS_ICON[status]
  return (
    <span
      aria-label={BOOKING_STATUS[status].label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center bg-white shadow-[0_0_0_1px_rgba(7,23,15,0.08)]',
        size === 'sm' ? 'h-4 w-4' : 'h-5 w-5',
        className,
      )}
    >
      <Icon
        size={size === 'sm' ? 10 : 12}
        strokeWidth={2.6}
        color={BOOKING_STATUS[status].dot}
        fill={status === 'active' ? BOOKING_STATUS[status].dot : 'none'}
      />
    </span>
  )
}
