/*
  Календарная арифметика на строках 'YYYY-MM-DD'. Считаем в UTC, чтобы
  часовой пояс сервера (Vercel — UTC) и браузера (Ташкент) не сдвигал день.
  «Сегодня» — по Ташкенту.
*/

const ISO = /^\d{4}-\d{2}-\d{2}$/

export const WEEKDAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']
export const WEEKDAYS_MINI = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
export const MONTHS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
]
const MONTHS_GEN = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

const toDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
const toIso = (date: Date) => date.toISOString().slice(0, 10)

export function isIsoDate(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    ISO.test(value) &&
    toIso(toDate(value)) === value
  )
}

export function todayTashkent(): string {
  // en-CA даёт ровно YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent' }).format(
    new Date(),
  )
}

export function addDays(iso: string, days: number): string {
  const d = toDate(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return toIso(d)
}

/** Понедельник недели, в которой лежит дата. */
export function startOfWeek(iso: string): string {
  const dow = (toDate(iso).getUTCDay() + 6) % 7
  return addDays(iso, -dow)
}

export const weekDays = (start: string) =>
  Array.from({ length: 7 }, (_, i) => addDays(start, i))

export const dayOfMonth = (iso: string) => Number(iso.slice(8, 10))
export const monthIndex = (iso: string) => Number(iso.slice(5, 7)) - 1
export const yearOf = (iso: string) => Number(iso.slice(0, 4))

/** «Ноябрь 2026» или «Ноябрь – Декабрь 2026» для недели на стыке месяцев. */
export function weekTitle(start: string): string {
  const end = addDays(start, 6)
  const [m1, m2, y1, y2] = [
    monthIndex(start),
    monthIndex(end),
    yearOf(start),
    yearOf(end),
  ]
  if (m1 === m2) return `${MONTHS[m1]} ${y1}`
  if (y1 === y2) return `${MONTHS[m1]} – ${MONTHS[m2]} ${y1}`
  return `${MONTHS[m1]} ${y1} – ${MONTHS[m2]} ${y2}`
}

/** «19 ноября 2026» — подпись выбранной даты. */
export function humanDate(iso: string): string {
  return `${dayOfMonth(iso)} ${MONTHS_GEN[monthIndex(iso)]} ${yearOf(iso)}`
}

/** «19 ноября 2026, чт» — для карточки брони. */
export function longDay(iso: string): string {
  const dow = WEEKDAYS[(toDate(iso).getUTCDay() + 6) % 7].toLowerCase()
  return `${dayOfMonth(iso)} ${MONTHS_GEN[monthIndex(iso)]} ${yearOf(iso)}, ${dow}`
}

/** Сетка мини-календаря: 6 недель с понедельника, покрывающие месяц. */
export function monthGrid(year: number, month: number): string[][] {
  const first = toIso(new Date(Date.UTC(year, month, 1)))
  const start = startOfWeek(first)
  return Array.from({ length: 6 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)),
  )
}
