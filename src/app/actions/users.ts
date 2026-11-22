'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { advertisers, users } from '@/db/schema'
import { requireRole } from '@/lib/auth'
import { isUniqueViolation, text, type FormState } from '@/lib/forms'
import { hashPassword } from '@/lib/password'

const LOGIN = /^[a-z0-9._-]{3,32}$/
const MIN_PASSWORD = 8

/**
 * Учётная запись рекламодателя: вход в кабинет, его брони и договоры.
 * Создаёт только admin; пароль хранится как scrypt с солью.
 */
export async function createAdvertiserUser(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireRole(['admin'])

  const advertiserId = text(fd, 'advertiserId', 36)
  const name = text(fd, 'name', 120)
  const login = text(fd, 'login', 64).toLowerCase()
  const password = String(fd.get('password') ?? '')

  const errors: Record<string, string> = {}
  if (!name) errors.name = 'Укажите имя'
  if (!LOGIN.test(login)) {
    errors.login = 'Латиница, цифры, точка, дефис или _; от 3 до 32 символов'
  }
  if (password.length < MIN_PASSWORD || password.length > 128) {
    errors.password = `Пароль — от ${MIN_PASSWORD} символов`
  }
  if (Object.keys(errors).length) return { errors }

  const db = getDb()
  const [advertiser] = await db
    .select({ name: advertisers.name })
    .from(advertisers)
    .where(eq(advertisers.id, advertiserId))
    .limit(1)
  if (!advertiser) return { error: 'Рекламодатель не найден' }

  try {
    await db.insert(users).values({
      login,
      name,
      role: 'advertiser',
      advertiserId,
      ...hashPassword(password),
    })
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { errors: { login: 'Такой логин уже занят' } }
    }
    throw err
  }

  revalidatePath('/advertisers')
  return {
    ok: true,
    message: `Доступ для ${advertiser.name} создан: логин ${login}`,
  }
}
