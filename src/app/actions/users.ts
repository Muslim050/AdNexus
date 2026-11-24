'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { advertisers, users } from '@/db/schema'
import { requireRole } from '@/lib/auth'
import { isUniqueViolation, text, type FormState } from '@/lib/forms'
import { hashPassword } from '@/lib/password'
import { LOGIN_TAKEN, readUser } from '@/lib/userForm'
import { EDITORS } from '@/lib/roles'

/**
 * Учётная запись рекламодателя: вход в кабинет, его брони и договоры.
 * Создают admin и manager; пароль хранится как scrypt с солью.
 */
export async function createAdvertiserUser(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireRole(EDITORS)
  const advertiserId = text(fd, 'advertiserId', 36)
  const read = readUser(fd, true)
  if (!read.ok) return { errors: read.errors }

  const db = getDb()
  const [advertiser] = await db
    .select({ name: advertisers.name })
    .from(advertisers)
    .where(eq(advertisers.id, advertiserId))
    .limit(1)
  if (!advertiser) return { error: 'Рекламодатель не найден' }

  try {
    await db.insert(users).values({
      ...read.values,
      role: 'advertiser',
      advertiserId,
      ...hashPassword(read.password),
    })
  } catch (err) {
    if (isUniqueViolation(err)) return LOGIN_TAKEN
    throw err
  }

  revalidatePath('/advertisers')
  return {
    ok: true,
    message: `Доступ для ${advertiser.name} создан: логин ${read.values.login}`,
  }
}

/** Правка учётной записи рекламодателя. Сотрудников так не изменить. */
export async function updateAdvertiserUser(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireRole(EDITORS)
  const id = text(fd, 'id', 36)
  const read = readUser(fd, false)
  if (!read.ok) return { errors: read.errors }

  try {
    const updated = await getDb()
      .update(users)
      .set({
        ...read.values,
        ...(read.password ? hashPassword(read.password) : {}),
      })
      .where(and(eq(users.id, id), eq(users.role, 'advertiser')))
      .returning({ id: users.id })
    if (!updated.length) return { error: 'Пользователь не найден' }
  } catch (err) {
    if (isUniqueViolation(err)) return LOGIN_TAKEN
    throw err
  }

  revalidatePath('/advertisers')
  return { ok: true, message: `Пользователь ${read.values.login} сохранён` }
}
