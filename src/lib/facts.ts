import type { BadgeTone } from '@/components/ui/Badge'
import type { AttachedFile } from './files'

/** Вышла публикация или нет. */
export const FACT_OUTCOMES = ['published', 'missed'] as const
export type FactOutcome = (typeof FACT_OUTCOMES)[number]
export const isFactOutcome = (v: unknown): v is FactOutcome =>
  FACT_OUTCOMES.includes(v as FactOutcome)

/** На столько минут выход может разойтись с планом. */
export const LATE_MINUTES = 30

export interface BookingFact {
  outcome: FactOutcome
  publishedAt: Date | string | null
  link: string
  impressions: number | null
  planImpressions: number
  screenshot: AttachedFile | null
  comment: string
  createdBy: string
}

/** Итог стыковки плана и факта. */
export const VERDICTS = ['waiting', 'mismatch', 'matched', 'missed'] as const
export type Verdict = (typeof VERDICTS)[number]
export const isVerdict = (v: unknown): v is Verdict =>
  VERDICTS.includes(v as Verdict)

/** label — у одной публикации, many — вкладки и итоги. */
export const VERDICT: Record<
  Verdict,
  { label: string; many: string; tone: BadgeTone }
> = {
  waiting: {
    label: 'Ожидает стыковки',
    many: 'Ожидают стыковки',
    tone: 'indigo',
  },
  mismatch: { label: 'Расхождение', many: 'Расхождения', tone: 'warning' },
  matched: { label: 'Стыковалась', many: 'Стыковались', tone: 'success' },
  missed: { label: 'Не вышла', many: 'Не вышли', tone: 'danger' },
}

/** Момент выхода по плану: дата и время слота — по Ташкенту. */
export const plannedAt = (date: string, time: string) =>
  new Date(`${date}T${time}:00+05:00`)

const num = (n: number) => n.toLocaleString('ru-RU')

/** «45 мин», «3 ч», «2 дн.» — насколько разошлось время. */
function span(minutes: number) {
  if (minutes < 60) return `${minutes} мин`
  if (minutes < 60 * 24) {
    const m = minutes % 60
    return `${Math.floor(minutes / 60)} ч${m ? ` ${m} мин` : ''}`
  }
  return `${Math.floor(minutes / (60 * 24))} дн.`
}

/** На сколько минут выход разошёлся с планом: плюс — позже, минус — раньше. */
export function shiftMinutes(
  plan: { date: string; time: string },
  fact: Pick<BookingFact, 'outcome' | 'publishedAt'> | null,
): number | null {
  if (fact?.outcome !== 'published' || !fact.publishedAt) return null
  return Math.round(
    (new Date(fact.publishedAt).getTime() -
      plannedAt(plan.date, plan.time).getTime()) /
      60_000,
  )
}

/**
 * Сверка плана с фактом: итог и причины словами. Время — с допуском
 * LATE_MINUTES, показы — не меньше плана; без плановых показов не сверяем.
 */
export function checkFact(
  plan: { date: string; time: string },
  fact: BookingFact | null,
): { verdict: Verdict; notes: string[] } {
  if (!fact) return { verdict: 'waiting', notes: [] }
  if (fact.outcome === 'missed') {
    return { verdict: 'missed', notes: fact.comment ? [fact.comment] : [] }
  }

  const notes: string[] = []
  const shift = shiftMinutes(plan, fact)
  if (shift !== null && Math.abs(shift) > LATE_MINUTES) {
    notes.push(
      `Вышло на ${span(Math.abs(shift))} ${shift > 0 ? 'позже' : 'раньше'}`,
    )
  }
  if (fact.impressions !== null && fact.impressions < fact.planImpressions) {
    notes.push(
      `Не хватает ${num(fact.planImpressions - fact.impressions)} показов`,
    )
  }
  if (notes.length) return { verdict: 'mismatch', notes }
  // Вышло вовремя, но показы ещё не посчитаны.
  if (fact.planImpressions > 0 && fact.impressions === null) {
    return { verdict: 'waiting', notes: ['Показы ещё не внесены'] }
  }
  return { verdict: 'matched', notes: [] }
}
