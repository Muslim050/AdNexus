'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell as BellIcon, ChevronRight } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/shadcn/popover'
import { cn } from '@/lib/cn'
import type { AttentionItem } from '@/lib/data/attention'

/**
 * Колокольчик: что ждёт действия. Точка — только когда что-то есть;
 * при открытии счётчики обновляются с сервера.
 */
export function Bell({ items }: { items: AttentionItem[] }) {
  const router = useRouter()
  const [refreshing, startRefresh] = useTransition()
  const total = items.reduce((n, it) => n + it.count, 0)
  const waiting = items.filter((it) => it.count > 0)

  return (
    <Popover
      onOpenChange={(open) => {
        if (open) startRefresh(() => router.refresh())
      }}
    >
      <PopoverTrigger
        aria-label={total ? `Ждут действия: ${total}` : 'Ждущих действий нет'}
        className="relative flex h-10 w-10 items-center justify-center text-white/70 transition-colors hover:bg-white/5 hover:text-white data-popup-open:bg-white/5 data-popup-open:text-white focus-ring"
      >
        <BellIcon size={18} aria-hidden="true" />
        {total > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 min-w-4 bg-lime-300 px-1 text-center font-mono text-[10px] font-bold leading-4 text-forest tnum"
          >
            {total > 99 ? '99+' : total}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-80 gap-0 rounded-none border border-line p-0 shadow-lift ring-0"
      >
        <div className="h-[3px] bg-indigo-500" />
        <p
          className={cn(
            'border-b border-line px-4 py-3 text-sm font-semibold text-ink transition-opacity',
            refreshing && 'opacity-60',
          )}
        >
          Ждёт действия
        </p>
        {waiting.length === 0 ? (
          <p className="px-4 py-5 text-sm text-ink-muted">
            Всё разобрано: новых заявок нет, факты внесены.
          </p>
        ) : (
          <ul>
            {waiting.map((it) => (
              <li key={it.href} className="border-b border-line last:border-0">
                <Link
                  href={it.href}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-ink transition-colors hover:bg-indigo-50/60 focus-ring"
                >
                  <span className="min-w-8 bg-forest px-1.5 py-0.5 text-center font-mono text-xs font-bold text-white tnum">
                    {it.count}
                  </span>
                  <span className="min-w-0 flex-1">{it.label}</span>
                  <ChevronRight
                    size={16}
                    className="shrink-0 text-ink-muted"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
