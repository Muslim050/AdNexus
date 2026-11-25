'use client'

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/Field'

/** Совпадает ли строка с запросом: все слова запроса — в каком-то из полей. */
export function matches(query: string, fields: (string | null | undefined)[]) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return true
  const text = fields.filter(Boolean).join(' ').toLowerCase()
  return words.every((w) => text.includes(w))
}

/** Поиск над списком и что делать, когда ничего не нашлось. */
export function ListSearch({
  value,
  onChange,
  placeholder,
  found,
  total,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  found: number
  total: number
}) {
  return (
    <>
      <div className="relative mb-4">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label="Поиск"
          className="pl-10 pr-10"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Очистить поиск"
            className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-ink-muted transition-colors hover:text-ink focus-ring"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {/* Сколько нашлось — для экранного диктора, без лишнего текста на экране. */}
      <p role="status" className="sr-only">
        {value ? `Найдено: ${found} из ${total}` : ''}
      </p>
      {value && found === 0 && (
        <div className="flex flex-col items-center gap-3 border border-line bg-hatch px-6 py-14 text-center">
          <p className="text-sm text-ink-muted">
            По запросу «{value.trim()}» ничего не нашлось.
          </p>
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-sm font-semibold text-indigo-600 underline-offset-2 hover:underline focus-ring"
          >
            Сбросить поиск
          </button>
        </div>
      )}
    </>
  )
}
