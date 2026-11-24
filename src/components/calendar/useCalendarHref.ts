import { useSearchParams } from 'next/navigation'
import { LIST_PARAMS, calendarHref, type CalendarView } from './types'

/** Ссылка на день или неделю сетки; список справа не сбрасывается. */
export function useCalendarHref() {
  const params = useSearchParams()
  const list = LIST_PARAMS.flatMap((key): [string, string][] => {
    const value = params.get(key)
    return value ? [[key, value]] : []
  })
  return (view: CalendarView, date?: string) => calendarHref(view, date, list)
}
