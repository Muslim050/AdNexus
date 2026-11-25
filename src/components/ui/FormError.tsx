import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Ошибка формы целиком: объявляется сразу, на неё уходит фокус. */
export function FormError({
  children,
  tone = 'danger',
  className,
}: {
  children: ReactNode
  tone?: 'danger' | 'warning'
  className?: string
}) {
  return (
    <p
      role="alert"
      tabIndex={-1}
      data-form-error
      className={cn(
        'border-l-2 px-3 py-2 text-sm outline-none',
        tone === 'danger'
          ? 'border-danger bg-danger/6 text-danger'
          : 'border-warning bg-warning/8 text-warning',
        className,
      )}
    >
      {children}
    </p>
  )
}
