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
