'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'

/** Вкладки-указатели внутри раздела: планка снизу у выбранной. */
export function SubTabs({
  tabs,
  children,
}: {
  tabs: { href: string; label: string; count?: number }[]
  /** Справа в той же строке — например, переключатель вида. */
  children?: ReactNode
}) {
  const pathname = usePathname()
  return (
    <div className="-mt-4 mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line">
      <nav className="flex gap-1">
        {tabs.map((tab) => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex items-center gap-2 px-4 py-3 text-[13.5px] font-semibold transition-colors focus-ring',
                active ? 'text-ink' : 'text-ink-muted hover:text-ink',
              )}
            >
              {tab.label}
              {tab.count != null && (
                <span className="font-mono text-[11px] text-ink-muted tnum">
                  {tab.count}
                </span>
              )}
              <span
                className={cn(
                  'absolute inset-x-3 -bottom-px h-[3px]',
                  active ? 'bg-indigo-500' : 'bg-transparent',
                )}
              />
            </Link>
          )
        })}
      </nav>
      {children}
    </div>
  )
}
