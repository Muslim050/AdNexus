import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

/** Таблица-«ведомость»: тонкие линии, моноширинные подписи колонок. */
export function Table({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableElement>) {
  return (
    // relative — иначе sr-only подписи в ячейках растягивают всю страницу.
    <div className="relative overflow-x-auto border border-line bg-surface">
      <table
        className={cn(
          'w-full min-w-[640px] border-collapse text-sm',
          className,
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

export function Th({
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'eyebrow border-b border-line bg-paper/60 px-4 py-3 text-left font-semibold text-ink-muted',
        className,
      )}
      {...props}
    />
  )
}

export function Td({
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        'border-b border-line px-4 py-3.5 align-top text-ink-soft',
        className,
      )}
      {...props}
    />
  )
}

export function Tr({
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'transition-colors last:[&>td]:border-b-0 hover:bg-indigo-50/40',
        className,
      )}
      {...props}
    />
  )
}
