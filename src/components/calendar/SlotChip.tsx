import { BOOKING_STATUS } from '@/lib/bookings'
import { cn } from '@/lib/cn'
import { slotLook } from './slotLook'
import { StatusPill } from './StatusPill'
import { slotLabel, type CalendarSlot } from './types'

/** Слот в сетке: подпись в цвете формата и статус; чужой — «Занято». */
export function SlotChip({
  slot: s,
  label = slotLabel(s),
  passed,
  onOpen,
}: {
  slot: CalendarSlot
  label?: string
  /** Уже вышел — приглушаем. */
  passed?: boolean
  onOpen: (slot: CalendarSlot) => void
}) {
  const look = slotLook(s.color, s.masked)
  return (
    <button
      type="button"
      onClick={() => !s.masked && onOpen(s)}
      title={
        s.masked
          ? 'Слот занят другим рекламодателем'
          : `${slotLabel(s)} · ${BOOKING_STATUS[s.status].label}`
      }
      className={cn(
        '@container relative z-10 flex w-full items-center gap-1.5 rounded-sm py-[3px] pl-1.5 pr-[3px] text-left text-[12px] font-semibold leading-[1.35] focus-ring',
        s.masked ? 'cursor-default' : 'transition-[filter] hover:brightness-95',
        passed && 'opacity-65',
        look.className,
      )}
      style={look.style}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {!s.masked && <StatusPill status={s.status} />}
    </button>
  )
}
