import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Поле карточки в сетке: подпись и значение. */
export function CardItem({
  label,
  wide,
  children,
}: {
  label: string
  wide?: boolean
  children: ReactNode
}) {
  return (
    <div className={cn('min-w-0', wide && 'col-span-2')}>
      <dt className="eyebrow text-ink-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink tnum [overflow-wrap:anywhere]">
        {children}
      </dd>
    </div>
  )
}
