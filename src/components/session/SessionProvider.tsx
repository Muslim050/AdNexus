'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { SessionUser } from '@/lib/roles'

const SessionContext = createContext<SessionUser | null>(null)

/** Текущий пользователь для клиентских компонентов: шапки, меню, прав. */
export function SessionProvider({
  user,
  children,
}: {
  user: SessionUser | null
  children: ReactNode
}) {
  return (
    <SessionContext.Provider value={user}>{children}</SessionContext.Provider>
  )
}

export function useSessionUser() {
  return useContext(SessionContext)
}
