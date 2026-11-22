import {
  BOOKING_STATUS,
  BOOKING_STATUSES,
  type BookingStatus,
} from '@/lib/bookings'

/**
 * Статус в шапке карточки: белая плашка, точка цвета статуса, название
 * и шаг воронки. «Отправлен» ждёт реакции — точка мягко пульсирует.
 */
export function StatusChip({ status }: { status: BookingStatus }) {
  const { label, dot } = BOOKING_STATUS[status]
  const step = BOOKING_STATUSES.indexOf(status) + 1
  return (
    <span className="inline-flex shrink-0 items-center gap-2.5 bg-white py-1.5 pl-2.5 pr-3 text-ink shadow-[0_2px_10px_-2px_rgba(7,23,15,0.35)]">
      <span className="relative flex h-2.5 w-2.5">
        {status === 'sent' && (
          <span
            className="absolute inset-0 motion-safe:animate-ping"
            style={{ background: dot, opacity: 0.55 }}
          />
        )}
        <span className="relative h-2.5 w-2.5" style={{ background: dot }} />
      </span>
      <span className="text-[13px] font-bold leading-none">{label}</span>
      <span className="border-l border-line pl-2.5 font-mono text-[10.5px] font-semibold leading-none text-ink-muted tnum">
        {step}/{BOOKING_STATUSES.length}
      </span>
    </span>
  )
}
