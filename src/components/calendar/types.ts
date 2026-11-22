export interface CalendarSlot {
  id: string
  date: string
  time: string
  orderRef: string
  comment: string
  createdBy: string
  formatId: string
  formatName: string
  color: string
  managerName: string
}

export type CalendarView = 'week' | 'day'

/** Подпись слота как в календаре: «10:30 | Айша | Post Instagram uzb | 3047». */
export const slotLabel = (s: CalendarSlot) =>
  [s.time, s.managerName, s.formatName, s.orderRef].filter(Boolean).join(' | ')

export const calendarHref = (view: CalendarView, date?: string) => {
  const params = new URLSearchParams()
  if (view === 'day') params.set('view', 'day')
  if (date) params.set('d', date)
  const qs = params.toString()
  return qs ? `/calendar?${qs}` : '/calendar'
}
