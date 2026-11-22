import type { AttachedFile } from '@/lib/files'

export interface CalendarSlot {
  id: string
  date: string
  time: string
  campaignName: string
  comment: string
  file: AttachedFile | null
  createdBy: string
  formatId: string
  formatName: string
  color: string
  managerId: string
  managerName: string
  advertiserId: string | null
  contractId: string | null
  advertiserName: string | null
  contractNumber: string | null
  contractDiscount: string | null
  contractStart: string | null
  contractEnd: string | null
  contractFile: AttachedFile | null
}

export type CalendarView = 'week' | 'day'

/** Подпись слота: «10:30 | Айша | Post Instagram uzb | Зимняя кампания». */
export const slotLabel = (s: CalendarSlot) =>
  [s.time, s.managerName, s.formatName, s.campaignName]
    .filter(Boolean)
    .join(' | ')

export const calendarHref = (view: CalendarView, date?: string) => {
  const params = new URLSearchParams()
  if (view === 'day') params.set('view', 'day')
  if (date) params.set('d', date)
  const qs = params.toString()
  return qs ? `/calendar?${qs}` : '/calendar'
}
