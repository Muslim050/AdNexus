import type { CalendarSlot } from '@/components/calendar/types'
import { BOOKING_STATUS, type BookingStatus } from '@/lib/bookings'
import { cn } from '@/lib/cn'
import { formatSum } from '@/lib/forms'

export function OrderStatus({ status }: { status: BookingStatus }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 border border-line px-2 py-1 text-xs font-semibold text-ink">
      <span
        className="h-2 w-2"
        style={{ background: BOOKING_STATUS[status].dot }}
      />
      {BOOKING_STATUS[status].label}
    </span>
  )
}

/** Сумма и оплата полосой; открывает выплаты, а не карточку брони. */
export function PaymentButton({
  slot: b,
  onPay,
  className,
}: {
  slot: CalendarSlot
  onPay: (id: string) => void
  className?: string
}) {
  const amount = Number(b.amount)
  const paid = Number(b.paid)
  const pct = amount ? Math.min(100, Math.round((paid / amount) * 100)) : 0
  return (
    <button
      type="button"
      title="Выплаты по брони"
      onClick={(e) => {
        e.stopPropagation()
        onPay(b.id)
      }}
      onKeyDown={(e) => e.stopPropagation()}
      className={cn(
        'block text-left transition-colors hover:bg-ink/4 focus-ring',
        className,
      )}
    >
      <span className="sr-only">Выплаты: сумма, оплачено. </span>
      {amount ? (
        <>
          <span className="flex items-baseline justify-between gap-3 whitespace-nowrap">
            <span className="text-xs text-ink-muted">{formatSum(amount)}</span>
            <span
              className={cn(
                'font-semibold',
                paid ? 'text-ink' : 'text-ink-muted',
              )}
            >
              {paid ? formatSum(paid) : '—'}
            </span>
          </span>
          <span className="relative mt-1.5 block h-5 overflow-hidden bg-ink/[0.06]">
            <span
              className={cn(
                'absolute inset-y-0 left-0',
                pct >= 100 ? 'bg-success' : 'bg-lime-300',
              )}
              style={{ width: paid ? `${Math.max(pct, 5)}%` : 0 }}
            />
            <span
              className={cn(
                'absolute inset-0 flex items-center justify-center font-mono text-[11px] font-bold',
                pct >= 100 ? 'text-white' : 'text-ink',
              )}
            >
              {pct}%
            </span>
          </span>
        </>
      ) : paid ? (
        formatSum(paid)
      ) : (
        <span className="text-ink-muted">—</span>
      )}
    </button>
  )
}
