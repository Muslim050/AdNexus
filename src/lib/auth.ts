import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { HOME, NAV } from './nav'
import type { Role, SessionUser } from './roles'
import { getSession } from './session'
import { getUserById } from './users'

/*
  Слой доступа (DAL): каждая страница и каждое действие кабинета проходит
  через эти функции. Проверка — на сервере и с базой: отключённый или
  удалённый пользователь теряет доступ сразу, даже с живой cookie.
*/

/** Текущий пользователь или null. Один запрос к БД на рендер. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await getSession()
  if (!session) return null
  const user = await getUserById(session.sub)
  // Роль берём из базы, а не из cookie: её могли сменить после входа.
  return user
})

/** Пользователь обязателен — иначе на вход. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

/** Пользователь с одной из ролей — иначе на стартовый раздел. */
export async function requireRole(roles: readonly Role[]) {
  const user = await requireUser()
  if (!roles.includes(user.role)) redirect(HOME)
  return user
}

/** Доступ к разделу меню — по ролям из NAV. */
export async function requireSection(href: string) {
  const item = NAV.find((n) => n.href === href)
  if (!item) throw new Error(`Раздел ${href} не описан в NAV`)
  return requireRole(item.roles)
}
