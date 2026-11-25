import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Плитка с цифрой над списком: подпись, значение, пояснение. */
export function Kpi({
  icon: Icon,
  label,
  value,
  note,
  alert,
}: {
  icon: LucideIcon
  label: string
  value: string
  note: string
  alert?: boolean
}) {
  return (
    // На телефоне — строкой: подпись и цифра, чтобы список начинался выше.
    <div
      className={cn(
        'flex items-start gap-3 border px-4 py-2.5 sm:py-3.5',
        alert ? 'border-warning/30 bg-warning/8' : 'border-line bg-surface',
      )}
    >
      <span className="mt-0.5 hidden h-9 w-9 shrink-0 items-center justify-center bg-indigo-50 text-indigo-600 sm:flex">
        <Icon size={18} />
      </span>
      <span className="flex min-w-0 flex-1 items-center justify-between gap-3 sm:block">
        <span className="eyebrow block text-ink-muted">{label}</span>
        <span className="block shrink-0 whitespace-nowrap font-display text-[17px] font-bold leading-snug text-ink tnum sm:mt-0.5 sm:truncate sm:text-[24px]">
          {value}
        </span>
        <span className="mt-1 hidden text-xs text-ink-muted sm:block">
          {note}
        </span>
      </span>
    </div>
  )
}
