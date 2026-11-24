import { useSyncExternalStore } from 'react'

const fmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tashkent',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** «2026-11-23 13:47» по Ташкенту — строка меняется раз в минуту. */
function snapshot() {
  const p = Object.fromEntries(
    fmt.formatToParts(new Date()).map((x) => [x.type, x.value]),
  )
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`
}

/** Дата и время по Ташкенту прямо сейчас — для обработчиков событий. */
export function nowTashkent(): { date: string; time: string } {
  const [date, time] = snapshot().split(' ')
  return { date, time }
}

const subscribe = (onChange: () => void) => {
  const id = setInterval(onChange, 20_000)
  return () => clearInterval(id)
}

/**
 * Текущие дата и время по Ташкенту для линии «сейчас». На сервере — null:
 * линию рисует только браузер, иначе разошлась бы гидрация.
 */
export function useNow(): { date: string; time: string } | null {
  const value = useSyncExternalStore(subscribe, snapshot, () => null)
  if (!value) return null
  const [date, time] = value.split(' ')
  return { date, time }
}
