import { useSyncExternalStore } from 'react'

const EVENT = 'adnexus:flag'

/**
 * Флаг интерфейса в localStorage — удобство этого браузера, не данные.
 * На сервере и без доступа к хранилищу — false.
 */
export function useStoredFlag(key: string): [boolean, (on: boolean) => void] {
  const value = useSyncExternalStore(
    (onChange) => {
      window.addEventListener('storage', onChange)
      window.addEventListener(EVENT, onChange)
      return () => {
        window.removeEventListener('storage', onChange)
        window.removeEventListener(EVENT, onChange)
      }
    },
    () => {
      try {
        return localStorage.getItem(key) === '1'
      } catch {
        return false
      }
    },
    () => false,
  )
  const set = (on: boolean) => {
    try {
      if (on) localStorage.setItem(key, '1')
      else localStorage.removeItem(key)
    } catch {
      // Хранилище закрыто — флаг просто не запомнится.
    }
    window.dispatchEvent(new Event(EVENT))
  }
  return [value, set]
}
