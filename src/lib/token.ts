import { createHmac, timingSafeEqual } from 'node:crypto'
import { isRole, type Role } from './roles'

/**
 * Токен сессии: base64url-JSON и HMAC-подпись через точку. Содержимое
 * читаемо, но без AUTH_SECRET его не подделать. Без next/headers — модуль
 * нужен и серверу, и proxy.
 */
export interface SessionPayload {
  sub: string
  role: Role
  exp: number
}

export const SESSION_COOKIE = 'adnexus_session'
/** Неделя. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7

function secret() {
  const s = process.env.AUTH_SECRET
  if (s && s.length >= 32) return s
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Задайте AUTH_SECRET (32+ символа) для подписи сессий.')
  }
  return 'dev-only-adnexus-session-secret-do-not-use'
}

const sign = (payload: string) =>
  createHmac('sha256', secret()).update(payload).digest('base64url')

export function encodeSession(data: Omit<SessionPayload, 'exp'>): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE
  const payload = Buffer.from(JSON.stringify({ ...data, exp })).toString(
    'base64url',
  )
  return `${payload}.${sign(payload)}`
}

export function decodeSession(
  token: string | undefined,
): SessionPayload | null {
  if (!token) return null
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  const expected = Buffer.from(sign(payload))
  const given = Buffer.from(sig)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return null
  }
  try {
    const data = JSON.parse(
      Buffer.from(payload, 'base64url').toString(),
    ) as SessionPayload
    if (!data.exp || data.exp < Date.now() / 1000) return null
    if (typeof data.sub !== 'string' || !isRole(data.role)) return null
    return data
  } catch {
    return null
  }
}
