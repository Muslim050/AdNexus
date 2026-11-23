'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { advertisers, users } from '@/db/schema'
import { requireRole } from '@/lib/auth'
import { isEmail, isUniqueViolation, text, type FormState } from '@/lib/forms'
import { hashPassword } from '@/lib/password'
import { PHONE_LENGTH, phoneDigits } from '@/lib/phone'

const LOGIN = /^[a-z0-9._-]{3,32}$/
const MIN_PASSWORD = 8

/** Поля пользователя рекламодателя; при правке пустой пароль — прежний. */
function readUser(fd: FormData, passwordRequired: boolean) {
  const firstName = text(fd, 'firstName', 60)
  const lastName = text(fd, 'lastName', 60)
  const email = text(fd, 'email', 200).toLowerCase()
  const phone = phoneDigits(text(fd, 'phone', 32))
  const login = text(fd, 'login', 64).toLowerCase()
  const password = String(fd.get('password') ?? '')
  const status = text(fd, 'status', 10)

  const errors: Record<string, string> = {}
  if (email && !isEmail(email)) errors.email = 'Проверьте адрес почты'
  if (phone && phone.length !== PHONE_LENGTH) {
    errors.phone = 'Девять цифр после +998'
  }
  if (!LOGIN.test(login)) {
    errors.login = 'Латиница, цифры, точка, дефис или _; от 3 до 32 символов'
  }
  if (
    (passwordRequired || password) &&
    (password.length < MIN_PASSWORD || password.length > 128)
  ) {
    errors.password = `Не короче ${MIN_PASSWORD} символов`
  }
  if (status !== 'active' && status !== 'off') errors.status = 'Выберите статус'
  if (Object.keys(errors).length) return { ok: false as const, errors }

  return {
    ok: true as const,
    password,
    values: {
      firstName,
      lastName,
      email,
      phone,
      login,
      // В шапке показываем имя, а без него — логин.
      name: `${firstName} ${lastName}`.trim() || login,
      isActive: status === 'active',
    },
  }
}

const LOGIN_TAKEN: FormState = { errors: { login: 'Такой логин уже занят' } }

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
  await requireRole(['admin'])
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
