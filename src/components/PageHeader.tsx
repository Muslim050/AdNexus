import type { ReactNode } from 'react'

/**
 * Заголовок раздела: крупное название и линия во всю ширину с изумрудным
 * отрезком. Номер раздела показывает шапка — здесь его не повторяем.
 */
export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="mb-8 shrink-0">
      <div className="flex flex-col gap-4 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {title && (
            <h1 className="font-display text-display-md font-bold text-ink sm:text-display-lg">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-ink-muted">
              {subtitle}
            </p>
          )}
        </div>
        {children && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {children}
          </div>
        )}
      </div>
      <div className="relative h-px bg-ink/15">
        <span className="absolute left-0 top-[-1px] h-[3px] w-16 bg-indigo-500" />
      </div>
    </div>
  )
}
