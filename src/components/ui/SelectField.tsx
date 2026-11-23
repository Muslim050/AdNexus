'use client'

import type { ReactNode } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select'
import { cn } from '@/lib/cn'
import { baseControl } from './Field'

export interface SelectOption {
  value: string
  label: string
  /** Вторая строка в списке: номер, срок, роль. */
  hint?: ReactNode
  /** Цветная метка слева — у форматов публикации. */
  color?: string
  disabled?: boolean
}

interface SelectFieldProps {
  /** Имя поля формы — Base UI кладёт значение в скрытый input. */
  name: string
  options: SelectOption[]
  /** Управляемый режим: '' — ничего не выбрано. */
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  /** Текст в пустом списке. */
  emptyText?: string
}

/** Выпадающий список на shadcn/ui (Base UI) в облике полей «Павильона». */
export function SelectField({
  name,
  options,
  value,
  defaultValue,
  onChange,
  placeholder = 'Выберите',
  disabled,
  invalid,
  emptyText = 'Нет вариантов',
}: SelectFieldProps) {
  const items = options.map((o) => ({ value: o.value, label: o.label }))
  const controlled = value !== undefined

  return (
    <Select
      name={name}
      items={items}
      {...(controlled
        ? { value: value || null }
        : { defaultValue: defaultValue || null })}
      onValueChange={(next) => onChange?.((next as string | null) ?? '')}
      disabled={disabled}
    >
      <SelectTrigger
        aria-invalid={invalid || undefined}
        className={cn(
          baseControl,
          // data-[size]: у shadcn-триггера своя высота h-8 — выравниваем с полями.
          'h-11 w-full cursor-pointer gap-2 pr-3 data-[size=default]:h-11 data-placeholder:text-ink-muted/80 data-popup-open:border-indigo-500 data-popup-open:shadow-[inset_0_-2px_0_var(--color-indigo-500)]',
          invalid && 'border-danger',
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        align="start"
        className="max-h-72 min-w-(--anchor-width) rounded-none border border-line p-1 shadow-lift ring-0"
      >
        {options.length === 0 ? (
          <p className="px-3 py-2.5 text-sm text-ink-muted">{emptyText}</p>
        ) : (
          options.map((o) => (
            <SelectItem
              key={o.value}
              value={o.value}
              label={o.label}
              disabled={o.disabled}
              className="min-h-10 rounded-none px-2.5 py-2 text-[13.5px] data-highlighted:bg-indigo-50 data-highlighted:text-ink data-selected:font-semibold"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                {o.color && (
                  <span
                    className="h-3 w-3 shrink-0"
                    style={{ background: o.color }}
                    aria-hidden="true"
                  />
                )}
                <span className="min-w-0">
                  <span className="block truncate">{o.label}</span>
                  {o.hint && (
                    <span className="block truncate text-xs font-normal text-ink-muted">
                      {o.hint}
                    </span>
                  )}
                </span>
              </span>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}
