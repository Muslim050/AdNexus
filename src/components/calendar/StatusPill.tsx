import { BOOKING_STATUS, type BookingStatus } from '@/lib/bookings'
import { cn } from '@/lib/cn'

/**
 * Статус на слоте — белая плашка с точкой цвета статуса и названием.
 * Слот — container: в узком слоте (неделя) остаётся только точка,
 * название видно в подсказке слота.
 */
export function StatusPill({
  status,
  className,
}: {
  status: BookingStatus
  className?: string
}) {
  const { label, dot } = BOOKING_STATUS[status]
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 bg-white px-1.5 py-[2px] text-[11px] font-semibold leading-none text-ink',
        className,
      )}
    >
      <span
        className="h-[7px] w-[7px] shrink-0"
        style={{ background: dot }}
        aria-hidden="true"
      />
      <span className="hidden @[200px]:inline">{label}</span>
      <span className="sr-only @[200px]:hidden">{label}</span>
    </span>
  )
}
