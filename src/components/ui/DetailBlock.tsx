import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Блок карточки: подпись капсом и сетка полей в две колонки. */
export function Block({
  title,
  plain,
  children,
}: {
  title: string
  /** Без сетки — для статуса, файлов и комментария. */
  plain?: boolean
  children: ReactNode
}) {
  return (
    <section className="border border-line">
      <h3 className="eyebrow flex items-center gap-2 border-b border-line bg-paper/70 px-4 py-2.5 font-mono text-ink-muted">
        <span className="h-1.5 w-1.5 bg-indigo-500" />
        {title}
      </h3>
      {plain ? (
        <div className="space-y-2 p-4">{children}</div>
      ) : (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 p-4 sm:grid-cols-2">
          {children}
        </dl>
      )}
    </section>
  )
}

export function Item({
  label,
  value,
  mono,
  wide,
}: {
  label: string
  value: ReactNode
  mono?: boolean
  wide?: boolean
}) {
  return (
    <div className={cn('min-w-0', wide && 'sm:col-span-2')}>
      <dt className="eyebrow text-ink-muted">{label}</dt>
      <dd
        className={cn(
          'mt-1 truncate text-sm font-semibold text-ink',
          mono && 'font-mono text-[13px]',
        )}
      >
        {value}
      </dd>
    </div>
  )
}
