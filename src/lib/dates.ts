/** 'YYYY-MM-DD' → 'дд.мм.гггг' без часовых поясов: дата календарная. */
export function formatDay(value: string | null | undefined): string {
  if (!value) return '—'
  const [y, m, d] = value.split('-')
  return y && m && d ? `${d}.${m}.${y}` : '—'
}

export function formatPeriod(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  if (!start && !end) return '—'
  return `${formatDay(start)} — ${formatDay(end)}`
}

/** Момент создания по Ташкенту: серверы Vercel живут в UTC. */
export function formatMoment(value: Date | string): string {
  return new Date(value).toLocaleString('ru-RU', {
    timeZone: 'Asia/Tashkent',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
