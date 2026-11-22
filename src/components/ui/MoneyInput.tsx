'use client'

import { useLayoutEffect, useRef, useState, type ChangeEvent } from 'react'
import { cn } from '@/lib/cn'
import { Input } from './Field'

/**
 * «1500000,5» → «1 500 000,5». Разряды — пробелами, дробная часть — после
 * запятой (точка тоже принимается). decimals = 0 — только целые.
 */
export function groupDigits(raw: string, decimals = 2): string {
  const cleaned = raw.replace(/[^\d.,]/g, '').replace('.', ',')
  const [intRaw, ...rest] = cleaned.split(',')
  const intPart = intRaw.replace(/^0+(?=\d)/, '')
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  if (decimals === 0 || rest.length === 0) return grouped
  return `${grouped},${rest.join('').slice(0, decimals)}`
}

/** Значение без пробелов и с точкой — как его понимает Number(). */
export const plainNumber = (value: string) =>
  value.replace(/\s/g, '').replace(',', '.')

interface MoneyInputProps {
  name: string
  /** Управляемый режим: строка без разделителей, например '1500000.5'. */
  value?: string
  defaultValue?: string
  onChange?: (plain: string) => void
  decimals?: number
  placeholder?: string
  invalid?: boolean
  autoFocus?: boolean
  className?: string
}

/**
 * Поле суммы с разделением разрядов при вводе. Курсор остаётся у той же
 * цифры, даже когда пробелы переставляются.
 */
export function MoneyInput({
  name,
  value,
  defaultValue = '',
  onChange,
  decimals = 2,
  placeholder = '0',
  invalid,
  autoFocus,
  className,
}: MoneyInputProps) {
  const ref = useRef<HTMLInputElement>(null)
  const [own, setOwn] = useState(() => groupDigits(defaultValue, decimals))
  const shown =
    value !== undefined ? groupDigits(value.replace('.', ','), decimals) : own
  // Сколько цифр было слева от курсора — по ним вернём курсор на место.
  const caretDigits = useRef<number | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    const want = caretDigits.current
    if (!el || want === null || document.activeElement !== el) return
    let pos = 0
    let seen = 0
    while (pos < shown.length && seen < want) {
      if (/[\d,]/.test(shown[pos])) seen++
      pos++
    }
    el.setSelectionRange(pos, pos)
    caretDigits.current = null
  }, [shown])

  const handle = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const before = input.value.slice(
      0,
      input.selectionStart ?? input.value.length,
    )
    caretDigits.current = before.replace(/[^\d.,]/g, '').length
    const next = groupDigits(input.value, decimals)
    if (value === undefined) setOwn(next)
    onChange?.(plainNumber(next))
  }

  return (
    <Input
      ref={ref}
      name={name}
      value={shown}
      onChange={handle}
      inputMode={decimals ? 'decimal' : 'numeric'}
      placeholder={placeholder}
      autoComplete="off"
      autoFocus={autoFocus}
      aria-invalid={invalid || undefined}
      className={cn('tnum', className)}
    />
  )
}
