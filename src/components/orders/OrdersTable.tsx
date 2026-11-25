import type { CalendarSlot } from '@/components/calendar/types'
import { BrandAvatar } from '@/components/ui/BrandAvatar'
import { cn } from '@/lib/cn'
import { formatSum } from '@/lib/forms'
import { OrderStatus, PaymentButton } from './parts'
import { shortDay } from './shortDay'

/** Публикации таблицей — на широком экране; уже их показывает OrderCards. */
export function OrdersTable({
  rows,
  firstIndex,
  today,
  onOpen,
  onPay,
  className,
}: {
  rows: CalendarSlot[]
  /** Номер первой строки: на второй странице нумерация продолжается. */
  firstIndex: number
  today: string
  onOpen: (id: string) => void
  onPay: (id: string) => void
  className?: string
}) {
  return (
    <div
      className={cn('overflow-x-auto border border-line bg-surface', className)}
    >
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {[
              '№',
              'Дата',
              'Рекламодатель и кампания',
              'Формат и время',
              'Менеджер',
              'Сумма / оплачено',
              'Остаток',
              'Статус',
              'Договор',
            ].map((h, i) => (
              <th
                key={h}
                className={cn(
                  'eyebrow border-b border-line bg-paper/60 px-2.5 py-3 text-left font-semibold text-ink-muted',
                  i === 0 && 'pl-4',
                  (h === 'Остаток' || h === 'Договор') && 'text-right',
                  h === 'Договор' && 'hidden pr-4 min-[1344px]:table-cell',
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((b, index) => {
            const amount = Number(b.amount)
            const paid = Number(b.paid)
            const past = b.date < today
            return (
              <tr
                key={b.id}
                onClick={() => onOpen(b.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onOpen(b.id)
                  }
                }}
                tabIndex={0}
                className="cursor-pointer border-b border-line transition-colors last:border-b-0 hover:bg-indigo-50/40 focus-visible:bg-indigo-50/60 focus-visible:outline-none"
              >
                <td className="whitespace-nowrap py-3 pl-4 pr-2 font-mono text-xs text-ink-muted tnum">
                  {firstIndex + index}
                </td>
                <td
                  className={cn(
                    'whitespace-nowrap px-2.5 py-3 font-semibold tnum',
                    past ? 'text-ink-muted' : 'text-ink',
                  )}
                >
                  {shortDay(b.date)}
                </td>
                <td className="max-w-[280px] px-2.5 py-3">
                  <span className="flex items-center gap-3">
                    {b.advertiserName ? (
                      <BrandAvatar
                        name={b.advertiserName}
                        logo={b.advertiserLogo}
                        color={b.advertiserColor}
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="h-10 w-10 shrink-0 border border-dashed border-ink/20"
                      />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-ink">
                        {b.advertiserName ?? 'Без рекламодателя'}
                      </span>
                      <span className="block truncate text-xs text-ink-muted">
                        {b.campaignName || '—'}
                      </span>
                    </span>
                  </span>
                </td>
                <td className="whitespace-nowrap px-2.5 py-3">
                  <span className="flex items-center gap-2 font-semibold text-ink">
                    <span
                      className="h-2.5 w-2.5 shrink-0"
                      style={{ background: b.color }}
                    />
                    {b.formatName}
                  </span>
                  <span className="mt-0.5 block pl-[18px] font-mono text-xs text-ink-muted tnum">
                    {b.time}
                  </span>
                </td>
                <td className="whitespace-nowrap px-2.5 py-3 text-ink-soft">
                  {b.managerName ?? (
                    <span className="text-ink-muted">Не назначен</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-2.5 py-3 tnum">
                  <PaymentButton
                    slot={b}
                    onPay={onPay}
                    className="-m-1.5 w-[228px] p-1.5"
                  />
                </td>
                <td className="whitespace-nowrap px-2.5 py-3 text-right font-semibold tnum">
                  {amount ? (
                    formatSum(Math.max(0, amount - paid))
                  ) : (
                    <span className="font-normal text-ink-muted">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-2.5 py-3">
                  <OrderStatus status={b.status} />
                </td>
                <td className="hidden whitespace-nowrap py-3 pl-2.5 pr-4 text-right min-[1344px]:table-cell font-mono text-xs text-ink-muted">
                  {b.contractNumber ? `№ ${b.contractNumber}` : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
