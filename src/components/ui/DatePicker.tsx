'use client'

import { useState } from 'react'
import { CalendarDays, X } from 'lucide-react'
import { ru } from 'react-day-picker/locale'
import { Calendar } from '@/components/shadcn/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/shadcn/popover'
import { cn } from '@/lib/cn'
import { humanDate } from '@/lib/week'
import { baseControl } from './Field'

const pad = (n: number) => String(n).padStart(2, '0')
/** 'YYYY-MM-DD' ↔ локальная дата браузера — без сдвига часового пояса. */
const toDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const toIso = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

interface DatePickerProps {
  /** Имя скрытого поля формы: уходит строкой 'YYYY-MM-DD' или пустой. */
  name: string
  defaultValue?: string
  /** Управляемый режим — когда от даты зависят другие поля. */
  value?: string
  onChange?: (value: string) => void
  min?: string | null
  max?: string | null
  placeholder?: string
  /** Можно очистить — для необязательных дат. */
  clearable?: boolean
  invalid?: boolean
}

/** Выбор даты: shadcn Calendar в поповере, по-русски, неделя с понедельника. */
export function DatePicker({
  name,
  defaultValue = '',
  value: controlled,
  onChange,
  min,
  max,
  placeholder = 'Выберите дату',
  clearable,
  invalid,
}: DatePickerProps) {
  const [own, setOwn] = useState(defaultValue)
  const [open, setOpen] = useState(false)
  const value = controlled ?? own

  const set = (next: string) => {
    if (controlled === undefined) setOwn(next)
    onChange?.(next)
  }

  const selected = value ? toDate(value) : undefined
  const disabled = [
    ...(min ? [{ before: toDate(min) }] : []),
    ...(max ? [{ after: toDate(max) }] : []),
  ]

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          type="button"
          aria-invalid={invalid || undefined}
          className={cn(
            baseControl,
            'flex h-11 cursor-pointer items-center justify-between gap-2 text-left',
            open &&
              'border-indigo-500 shadow-[inset_0_-2px_0_var(--color-indigo-500)]',
            invalid && 'border-danger',
          )}
        >
          <span
            className={cn('truncate', value ? 'text-ink' : 'text-ink-muted/80')}
          >
            {value ? humanDate(value) : placeholder}
          </span>
          <CalendarDays size={16} className="shrink-0 text-ink-muted" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-auto gap-0 rounded-none border border-line p-0 shadow-lift ring-0"
        >
          <Calendar
            mode="single"
            locale={ru}
            selected={selected}
            defaultMonth={selected ?? (min ? toDate(min) : undefined)}
            disabled={disabled}
            onSelect={(date) => {
              if (!date) return
              set(toIso(date))
              setOpen(false)
            }}
            className="p-3 [--cell-size:--spacing(9)]"
          />
          {clearable && value && (
            <button
              type="button"
              onClick={() => {
                set('')
                setOpen(false)
              }}
              className="flex w-full items-center justify-center gap-1.5 border-t border-line py-2.5 text-[12.5px] font-semibold text-ink-muted transition-colors hover:bg-ink/4 hover:text-ink"
            >
              <X size={14} />
              Очистить
            </button>
          )}
        </PopoverContent>
      </Popover>
    </>
  )
}
