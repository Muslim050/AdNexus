/** Ответ серверного действия формы: ошибки по полям или успех. */
export interface FormState {
  ok?: boolean
  /** Сообщение для тоста при успехе. */
  message?: string
  /** Ошибка формы целиком — не привязана к полю. */
  error?: string
  errors?: Record<string, string>
}

export const text = (fd: FormData, key: string, max = 500) =>
  String(fd.get(key) ?? '')
    .trim()
    .slice(0, max)

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Дата из `<input type="date">`: 'YYYY-MM-DD' или пусто. */
export function dateField(fd: FormData, key: string): string | null | false {
  const value = text(fd, key, 10)
  if (!value) return null
  if (!ISO_DATE.test(value) || Number.isNaN(Date.parse(value))) return false
  return value
}

/** Процент 0–100 с запятой или точкой; пусто — 0, неверно — false. */
export function percentField(fd: FormData, key: string): number | false {
  const raw = text(fd, key, 10).replace(',', '.').replace('%', '').trim()
  if (!raw) return 0
  const value = Number(raw)
  if (!Number.isFinite(value) || value < 0 || value > 100) return false
  return Math.round(value * 100) / 100
}

/** '12.50' → '12,5 %', '0.00' → '—'. */
export function formatPercent(value: string | number | null | undefined) {
  const n = Number(value ?? 0)
  if (!n) return '—'
  return `${n.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} %`
}

export const isEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

/** Нарушение уникальности в Postgres — код 23505, в том числе внутри обёртки Drizzle. */
export function isUniqueViolation(err: unknown): boolean {
  let e: unknown = err
  for (let i = 0; i < 3 && e; i++) {
    if ((e as { code?: string }).code === '23505') return true
    e = (e as { cause?: unknown }).cause
  }
  return false
}
