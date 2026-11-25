import type { CalendarSlot } from '@/components/calendar/types'
import { BrandAvatar } from '@/components/ui/BrandAvatar'
import { cn } from '@/lib/cn'
import { formatSum } from '@/lib/forms'
import { OrderStatus, PaymentButton } from './parts'
import { shortDay } from './shortDay'

/** Публикации карточками — на телефоне и планшете, где таблица не помещается. */
export function OrderCards({
  rows,
  today,
  onOpen,
  onPay,
  className,
}: {
  rows: CalendarSlot[]
  today: string
  onOpen: (id: string) => void
  onPay: (id: string) => void
  className?: string
}) {
  return (
    <ul className={cn('grid gap-3 md:grid-cols-2', className)}>
      {rows.map((b) => {
        const amount = Number(b.amount)
        const left = amount - Number(b.paid)
        return (
          <li
            key={b.id}
            className="flex min-w-0 flex-col border border-line bg-surface"
          >
            <button
              type="button"
              onClick={() => onOpen(b.id)}
              className="flex-1 space-y-3 p-4 text-left transition-colors hover:bg-indigo-50/40 focus-ring"
            >
              <span className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    'font-semibold tnum',
                    b.date < today ? 'text-ink-muted' : 'text-ink',
                  )}
                >
                  {shortDay(b.date)} · {b.time}
                </span>
                <OrderStatus status={b.status} />
              </span>
              <span className="flex items-center gap-3">
                {b.advertiserName && (
                  <BrandAvatar
                    name={b.advertiserName}
                    logo={b.advertiserLogo}
                    color={b.advertiserColor}
                  />
                )}
                <span className="min-w-0">
                  <span className="block font-semibold text-ink [overflow-wrap:anywhere]">
                    {b.advertiserName ?? 'Без рекламодателя'}
                  </span>
                  <span className="block text-sm text-ink-muted [overflow-wrap:anywhere]">
                    {b.campaignName || '—'}
                  </span>
                </span>
              </span>
              <span className="flex items-center gap-2 text-sm text-ink-soft">
                <span
                  className="h-2.5 w-2.5 shrink-0"
                  style={{ background: b.color }}
                />
                <span className="min-w-0 truncate">{b.formatName}</span>
              </span>
            </button>
            <PaymentButton
              slot={b}
              onPay={onPay}
              className="w-full border-t border-line px-4 pb-3 pt-2.5"
            />
            {left > 0 && (
              <p className="flex justify-between gap-3 px-4 pb-3 text-sm">
                <span className="text-ink-muted">Остаток</span>
                <span className="font-semibold text-ink tnum">
                  {formatSum(left)}
                </span>
              </p>
            )}
          </li>
        )
      })}
    </ul>
  )
}
