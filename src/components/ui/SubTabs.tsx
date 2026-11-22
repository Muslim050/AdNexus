'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'

/** Вкладки-указатели внутри раздела: планка снизу у выбранной. */
export function SubTabs({
  tabs,
}: {
  tabs: { href: string; label: string; count?: number }[]
}) {
  const pathname = usePathname()
  return (
    <nav className="-mt-4 mb-6 flex gap-1 border-b border-line">
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
  )
}
