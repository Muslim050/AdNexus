import { WEEKDAYS, dayOfMonth, dayOfWeek, monthIndex } from '@/lib/week'

const MONTHS_GEN_SHORT = [
  'янв.',
  'февр.',
  'мар.',
  'апр.',
  'мая',
  'июн.',
  'июл.',
  'авг.',
  'сент.',
  'окт.',
  'нояб.',
  'дек.',
]
/** «24 нояб., вт» */
export const shortDay = (iso: string) =>
  `${dayOfMonth(iso)} ${MONTHS_GEN_SHORT[monthIndex(iso)]}, ${WEEKDAYS[dayOfWeek(iso)].toLowerCase()}`
