import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/**
 * true только в браузере. Порталам в `document.body` нужен DOM, а при
 * серверном рендере его нет — до гидрации они ничего не рисуют.
 */
export function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}
