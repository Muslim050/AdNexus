import { cn } from '@/lib/cn'
import { slotLook } from './slotLook'
import { StatusPill } from './StatusPill'
import { slotText, slotTitle, type CalendarSlot } from './types'

/**
 * Слот в сетке цветом формата: время, бренд с кампанией и статус; чужой —
 * «Занято». В узкой колонке недели бренд встаёт второй строкой, в широкой
 * (день) всё в одну, и туда же помещается формат.
 */
export function SlotChip({
  slot: s,
  ownBrand,
  passed,
  onOpen,
}: {
  slot: CalendarSlot
  /** Рекламодатель видит только своё — бренд в подписи лишний. */
  ownBrand?: boolean
  /** Уже вышел — приглушаем. */
  passed?: boolean
  onOpen: (slot: CalendarSlot) => void
}) {
  const look = slotLook(s.color, s.masked, passed)
  return (
    <button
      type="button"
      data-slot-id={s.id}
      onClick={() => !s.masked && onOpen(s)}
      title={s.masked ? 'Слот занят другим рекламодателем' : slotTitle(s)}
      className={cn(
        '@container relative z-10 block w-full rounded-sm py-[2px] pl-1.5 pr-[3px] text-left text-[12px] leading-[1.35] focus-ring',
        s.masked ? 'cursor-default' : 'transition-[filter] hover:brightness-95',
        look.className,
      )}
      style={look.style}
    >
      <span className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 @[240px]:grid-cols-[auto_minmax(0,1fr)_auto] @[240px]:py-px">
        <span className="font-bold tnum">{s.time}</span>
        <span className="col-span-2 row-start-2 truncate font-semibold @[240px]:col-span-1 @[240px]:col-start-2 @[240px]:row-start-1">
          {slotText(s, ownBrand)}
          <span className="sr-only font-normal @[420px]:not-sr-only">
            {' '}
            · {s.formatName}
          </span>
        </span>
        {!s.masked && (
          <StatusPill
            status={s.status}
            className="col-start-2 row-start-1 @[240px]:col-start-3"
          />
        )}
      </span>
    </button>
  )
}
