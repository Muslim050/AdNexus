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
    <div
      className={cn(
        'flex items-start gap-3 border px-4 py-3.5',
        alert ? 'border-warning/30 bg-warning/8' : 'border-line bg-surface',
      )}
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center bg-indigo-50 text-indigo-600">
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="eyebrow block text-ink-muted">{label}</span>
        <span className="mt-1 block truncate font-display text-[24px] font-bold leading-none text-ink tnum">
          {value}
        </span>
        <span className="mt-1.5 block text-xs text-ink-muted">{note}</span>
      </span>
    </div>
  )
}
