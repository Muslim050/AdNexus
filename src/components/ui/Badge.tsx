import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

// Бейдж — прямоугольная «табличка» с тонкой рамкой в цвет статуса.
const tones = {
  success: 'bg-success/8 text-success border-success/25',
  warning: 'bg-warning/10 text-warning border-warning/30',
  danger: 'bg-danger/8 text-danger border-danger/25',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  info: 'bg-info/8 text-info border-info/25',
  muted: 'bg-ink/[0.04] text-ink-soft border-ink/12',
  lime: 'bg-lime-50 text-lime-600 border-lime-200',
}

export type BadgeTone = keyof typeof tones

export function Badge({
  tone = 'muted',
  className,
  dot = false,
  children,
}: {
  tone?: BadgeTone
  className?: string
  dot?: boolean
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border px-2 py-[3px] text-[11.5px] font-semibold leading-tight',
        tones[tone] ?? tones.muted,
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 shrink-0 bg-current" />}
      {children}
    </span>
  )
}
