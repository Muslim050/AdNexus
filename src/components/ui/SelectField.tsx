'use client'

import { useState, type ReactNode } from 'react'
import { Combobox } from '@base-ui/react/combobox'
import { Check, ChevronDown, Search } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select'
import { cn } from '@/lib/cn'
import { baseControl, useField, useFieldAria } from './Field'

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
  /** Имя поля формы — значение уходит скрытым input. */
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
  /** Подпись для чтения с экрана — у списка без поля с подписью (фильтры). */
  label?: string
}

/** С этого числа вариантов в списке появляется поиск. */
const SEARCH_FROM = 8

const trigger =
  'h-11 w-full cursor-pointer gap-2 pr-3 data-[size=default]:h-11 data-placeholder:text-ink-muted data-popup-open:border-indigo-500 data-popup-open:shadow-[inset_0_-2px_0_var(--color-indigo-500)]'

const popup =
  'max-h-72 min-w-(--anchor-width) rounded-none border border-line bg-popover p-1 shadow-lift ring-0'

const item =
  'flex min-h-10 cursor-default select-none items-center gap-2 rounded-none px-2.5 py-2 text-[13.5px] outline-none data-highlighted:bg-indigo-50 data-highlighted:text-ink data-selected:font-semibold data-disabled:opacity-50'

/**
 * Выпадающий список в облике полей «Павильона». Короткий — Select из
 * shadcn/ui; длинный (бренды, договоры, менеджеры) — с поиском по названию
 * и подписи, чтобы не листать сотню строк.
 */
export function SelectField(props: SelectFieldProps) {
  return props.options.length >= SEARCH_FROM ? (
    <SearchSelect {...props} />
  ) : (
    <PlainSelect {...props} />
  )
}

function PlainSelect({
  name,
  options,
  value,
  defaultValue,
  onChange,
  placeholder = 'Выберите',
  disabled,
  invalid,
  emptyText = 'Нет вариантов',
  label,
}: SelectFieldProps) {
  const items = options.map((o) => ({ value: o.value, label: o.label }))
  const controlled = value !== undefined
  const field = useField()
  const aria = useFieldAria(invalid)

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
        {...aria}
        aria-label={field ? undefined : label}
        aria-labelledby={field?.labelId}
        className={cn(
          baseControl,
          trigger,
          aria['aria-invalid'] && 'border-danger',
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        align="start"
        className={popup}
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
              <OptionText option={o} />
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}

/** Список с полем поиска в открытом окне — Combobox из Base UI. */
function SearchSelect({
  name,
  options,
  value,
  defaultValue = '',
  onChange,
  placeholder = 'Выберите',
  disabled,
  invalid,
  emptyText = 'Нет вариантов',
  label,
}: SelectFieldProps) {
  const [own, setOwn] = useState(defaultValue)
  const current = value ?? own
  const selected = options.find((o) => o.value === current) ?? null
  const field = useField()
  const aria = useFieldAria(invalid)

  const pick = (next: SelectOption | null) => {
    const v = next?.value ?? ''
    if (value === undefined) setOwn(v)
    onChange?.(v)
  }

  return (
    <>
      <input type="hidden" name={name} value={current} />
      <Combobox.Root
        items={options}
        value={selected}
        onValueChange={pick}
        disabled={disabled}
        itemToStringLabel={(o: SelectOption) => o.label}
        isItemEqualToValue={(a: SelectOption, b: SelectOption) =>
          a.value === b.value
        }
        filter={(o: SelectOption, query: string) =>
          `${o.label} ${typeof o.hint === 'string' ? o.hint : ''}`
            .toLowerCase()
            .includes(query.trim().toLowerCase())
        }
      >
        <Combobox.Trigger
          {...aria}
          aria-label={field ? undefined : label}
          aria-labelledby={
            field && aria.id ? `${field.labelId} ${aria.id}` : undefined
          }
          className={cn(
            baseControl,
            'flex items-center justify-between text-left',
            trigger,
            aria['aria-invalid'] && 'border-danger',
          )}
        >
          <span
            className={cn(
              'flex min-w-0 items-center gap-2.5 truncate',
              !selected && 'text-ink-muted',
            )}
          >
            {selected?.color && (
              <span
                className="h-3 w-3 shrink-0"
                style={{ background: selected.color }}
                aria-hidden="true"
              />
            )}
            <span className="truncate">{selected?.label ?? placeholder}</span>
          </span>
          <ChevronDown
            size={16}
            className="shrink-0 text-ink-muted"
            aria-hidden="true"
          />
        </Combobox.Trigger>
        <Combobox.Portal>
          <Combobox.Positioner
            align="start"
            sideOffset={4}
            className="isolate z-50"
          >
            <Combobox.Popup
              className={cn(popup, 'flex w-(--anchor-width) flex-col p-0')}
            >
              <div className="relative border-b border-line">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
                  aria-hidden="true"
                />
                <Combobox.Input
                  placeholder="Поиск"
                  aria-label="Поиск в списке"
                  className="h-10 w-full bg-transparent pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink-muted"
                />
              </div>
              <Combobox.Empty className="px-3 py-2.5 text-sm text-ink-muted empty:hidden">
                {options.length ? 'Ничего не нашлось' : emptyText}
              </Combobox.Empty>
              <Combobox.List className="max-h-60 overflow-y-auto p-1 empty:p-0">
                {(o: SelectOption) => (
                  <Combobox.Item
                    key={o.value}
                    value={o}
                    disabled={o.disabled}
                    className={item}
                  >
                    <span className="min-w-0 flex-1">
                      <OptionText option={o} />
                    </span>
                    <Combobox.ItemIndicator>
                      <Check size={15} aria-hidden="true" />
                    </Combobox.ItemIndicator>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </>
  )
}

function OptionText({ option: o }: { option: SelectOption }) {
  return (
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
  )
}
