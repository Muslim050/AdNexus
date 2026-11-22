import 'server-only'
import { cookies } from 'next/headers'
import { connection } from 'next/server'
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  decodeSession,
  encodeSession,
  type SessionPayload,
} from './token'

/** Сессия из cookie запроса. Читает запрос — только внутри <Suspense>. */
export async function getSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  // Срок сессии сверяется с часами — помечаем чтение как работу запроса.
  await connection()
  return decodeSession(token)
}

export async function setSession(data: Omit<SessionPayload, 'exp'>) {
  ;(await cookies()).set(SESSION_COOKIE, encodeSession(data), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

export async function clearSession() {
  ;(await cookies()).delete(SESSION_COOKIE)
}
