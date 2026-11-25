'use client'

import { useState } from 'react'
import { Clock } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/shadcn/popover'
import { cn } from '@/lib/cn'
import { baseControl, useField, useFieldAria } from './Field'

const pad = (n: number) => String(n).padStart(2, '0')
const HOURS = Array.from({ length: 24 }, (_, h) => pad(h))

interface TimePickerProps {
  /** Имя скрытого поля формы: уходит строкой 'HH:MM'. */
  name: string
  defaultValue?: string
  /** Шаг минут: 5 — 00, 05, 10… */
  step?: number
  invalid?: boolean
  /** Вызывается с 'HH:MM' при каждом выборе. */
  onChange?: (value: string) => void
}

/**
 * Выбор времени: часы и минуты двумя колонками в поповере shadcn.
 * Выбор минут закрывает поповер — час обычно выбирают первым.
 */
export function TimePicker({
  name,
  defaultValue = '10:00',
  step = 5,
  invalid,
  onChange,
}: TimePickerProps) {
  const [value, setOwn] = useState(defaultValue)
  const setValue = (next: string) => {
    setOwn(next)
    onChange?.(next)
  }
  const field = useField()
  const aria = useFieldAria(invalid)
  const [open, setOpen] = useState(false)
  const [hour, minute] = value.split(':')

  const minutes = Array.from({ length: 60 / step }, (_, i) => pad(i * step))
  // Время из базы может не попадать в шаг — показываем его, чтобы не потерять.
  if (!minutes.includes(minute)) minutes.push(minute)
  minutes.sort()

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          type="button"
          {...aria}
          aria-labelledby={
            field && aria.id ? `${field.labelId} ${aria.id}` : undefined
          }
          className={cn(
            baseControl,
            'flex h-11 cursor-pointer items-center justify-between text-left tnum',
            open &&
              'border-indigo-500 shadow-[inset_0_-2px_0_var(--color-indigo-500)]',
            aria['aria-invalid'] && 'border-danger',
          )}
        >
          <span className="font-semibold">{value}</span>
          <Clock size={16} className="text-ink-muted" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-auto gap-0 rounded-none border border-line p-0 shadow-lift ring-0"
        >
          <div className="grid grid-cols-2 divide-x divide-line">
            <Column
              label="Часы"
              items={HOURS}
              selected={hour}
              onPick={(h) => setValue(`${h}:${minute}`)}
            />
            <Column
              label="Минуты"
              items={minutes}
              selected={minute}
              onPick={(m) => {
                setValue(`${hour}:${m}`)
                setOpen(false)
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}

function Column({
  label,
  items,
  selected,
  onPick,
}: {
  label: string
  items: string[]
  selected: string
  onPick: (value: string) => void
}) {
  return (
    <div className="w-20">
      <p className="eyebrow border-b border-line px-3 py-2 text-center text-ink-muted">
        {label}
      </p>
      <div
        role="listbox"
        aria-label={label}
        // relative — чтобы offsetTop кнопок считался от колонки.
        className="no-scrollbar relative h-60 overflow-y-auto p-1"
      >
        {items.map((item) => {
          const active = item === selected
          return (
            <button
              key={item}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => onPick(item)}
              // Выбранное значение — по центру колонки при открытии.
              ref={
                active
                  ? (el) => {
                      // Поповер получает размеры после монтирования —
                      // меряем на следующем кадре, иначе высота колонки 0.
                      requestAnimationFrame(() => {
                        const box = el?.parentElement
                        if (el && box) {
                          box.scrollTop =
                            el.offsetTop -
                            box.clientHeight / 2 +
                            el.clientHeight / 2
                        }
                      })
                    }
                  : undefined
              }
              className={cn(
                'flex h-9 w-full items-center justify-center text-[14px] tnum transition-colors focus-ring',
                active
                  ? 'bg-indigo-500 font-bold text-white'
                  : 'text-ink hover:bg-indigo-50',
              )}
            >
              {item}
            </button>
          )
        })}
      </div>
    </div>
  )
}
