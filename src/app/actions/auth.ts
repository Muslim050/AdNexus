'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { HOME } from '@/lib/nav'
import { settleLoginAttempt, takeLoginAttempt } from '@/lib/rateLimit'
import { clearSession, setSession } from '@/lib/session'
import { verifyUser } from '@/lib/users'

export interface LoginState {
  error?: string
  /** Логин возвращаем в форму, чтобы не набирать заново. */
  login?: string
}

const WRONG = 'Неверный логин или пароль'
const MAX_IP = 64
const MAX_LOGIN = 64
const MAX_PASSWORD = 1024

/** Вход по логину и паролю — другого способа войти нет. */
export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const loginValue = String(formData.get('login') ?? '')
    .trim()
    .toLowerCase()
  const password = String(formData.get('password') ?? '')
  const keep = { login: loginValue.slice(0, MAX_LOGIN) }

  if (!loginValue || !password) {
    return { ...keep, error: 'Введите логин и пароль' }
  }
  // Подбирать нечем, а такой длинный ключ не влезет в индекс лимитера.
  if (loginValue.length > MAX_LOGIN || password.length > MAX_PASSWORD) {
    return { ...keep, error: WRONG }
  }

  // Vercel ставит заголовок сам. В других средах его можно подделать —
  // тогда держит лимит на логин.
  const ip = (
    (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  ).slice(0, MAX_IP)

  if (!(await takeLoginAttempt(ip, loginValue))) {
    return {
      ...keep,
      error: 'Слишком много попыток. Попробуйте через 15 минут.',
    }
  }

  const user = await verifyUser(loginValue, password)
  if (!user) return { ...keep, error: WRONG }

  await settleLoginAttempt(ip, loginValue)
  await setSession({ sub: user.id, role: user.role })
  redirect(HOME)
}

export async function logout() {
  await clearSession()
  redirect('/login')
}
