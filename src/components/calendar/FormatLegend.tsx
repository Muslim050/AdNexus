'use client'

import { cn } from '@/lib/cn'
import { BOOKING_STATUS, BOOKING_STATUSES } from '@/lib/bookings'
import { textOn } from '@/lib/palette'
import { slotLook } from './slotLook'
import type { FormatChoice } from './BookingFields'

/** Легенда форматов с галочками — скрыть или показать формат в календаре. */
export function FormatLegend({
  formats,
  hidden,
  onToggle,
}: {
  formats: FormatChoice[]
  hidden: string[]
  onToggle: (id: string) => void
}) {
  if (formats.length === 0) return null
  return (
    <div>
      <p className="eyebrow mb-2 text-ink-muted">Форматы</p>
      <ul className="space-y-0.5">
        {formats.map((f) => {
          const shown = !hidden.includes(f.id)
          return (
            <li key={f.id}>
              <label className="flex cursor-pointer items-center gap-2.5 px-1 py-1.5 text-[13px] text-ink-soft hover:bg-ink/4">
                <input
                  type="checkbox"
                  checked={shown}
                  onChange={() => onToggle(f.id)}
                  className="peer sr-only"
                />
                <span
                  className="flex h-[18px] w-[18px] shrink-0 items-center justify-center border-2 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 peer-focus-visible:ring-offset-1"
                  style={{
                    borderColor: f.color,
                    background: shown ? f.color : 'transparent',
                  }}
                >
                  {shown && (
                    <svg
                      viewBox="0 0 12 12"
                      className="h-3 w-3"
                      aria-hidden="true"
                    >
                      <path
                        d="M2.5 6.2 5 8.5l4.5-5"
                        fill="none"
                        stroke={textOn(f.color)}
                        strokeWidth="1.8"
                      />
                    </svg>
                  )}
                </span>
                <span className={cn('truncate', !f.isActive && 'line-through')}>
                  {f.name}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Как выглядит слот в каждом статусе. */
export function StatusLegend() {
  const sample = '#546E7A'
  return (
    <div>
      <p className="eyebrow mb-2 text-ink-muted">Статусы</p>
      <ul className="space-y-1.5">
        {BOOKING_STATUSES.map((status) => {
          const look = slotLook(sample, status, false)
          return (
            <li key={status} className="flex items-center gap-2.5 px-1">
              <span
                className={cn('h-[14px] w-[22px] shrink-0', look.className)}
                style={look.style}
              />
              <span className="text-[13px] text-ink-soft">
                {BOOKING_STATUS[status].label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
