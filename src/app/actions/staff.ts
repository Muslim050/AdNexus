'use server'

import { revalidatePath } from 'next/cache'
import { and, eq, inArray } from 'drizzle-orm'
import { getDb } from '@/db'
import { users } from '@/db/schema'
import { requireRole } from '@/lib/auth'
import { isUniqueViolation, text, type FormState } from '@/lib/forms'
import { hashPassword } from '@/lib/password'
import { OWNERS, ROLE_INFO, STAFF, isStaffRole } from '@/lib/roles'
import { LOGIN_TAKEN, readUser } from '@/lib/userForm'

/** Новый сотрудник. Роль — только из сотрудников, рекламодателя так не завести. */
export async function createStaff(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireRole(OWNERS)
  const role = text(fd, 'role', 20)
  const read = readUser(fd, true)
  const errors = {
    ...(read.ok ? {} : read.errors),
    ...(isStaffRole(role) ? {} : { role: 'Выберите роль' }),
  }
  if (!read.ok || !isStaffRole(role)) return { errors }

  try {
    await getDb()
      .insert(users)
      .values({ ...read.values, role, ...hashPassword(read.password) })
  } catch (err) {
    if (isUniqueViolation(err)) return LOGIN_TAKEN
    throw err
  }

  revalidatePath('/staff')
  return {
    ok: true,
    message: `${ROLE_INFO[role].label} добавлен: логин ${read.values.login}`,
  }
}

/**
 * Правка сотрудника. Свою роль и статус изменить нельзя — так площадка не
 * останется без администратора.
 */
export async function updateStaff(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const me = await requireRole(OWNERS)
  const id = text(fd, 'id', 36)
  const self = id === me.id
  if (self) {
    fd.set('role', me.role)
    fd.set('status', 'active')
  }
  const role = text(fd, 'role', 20)
  const read = readUser(fd, false)
  const errors = {
    ...(read.ok ? {} : read.errors),
    ...(isStaffRole(role) ? {} : { role: 'Выберите роль' }),
  }
  if (!read.ok || !isStaffRole(role)) return { errors }

  try {
    const updated = await getDb()
      .update(users)
      .set({
        ...read.values,
        role,
        ...(read.password ? hashPassword(read.password) : {}),
      })
      .where(and(eq(users.id, id), inArray(users.role, STAFF)))
      .returning({ id: users.id })
    if (!updated.length) return { error: 'Сотрудник не найден' }
  } catch (err) {
    if (isUniqueViolation(err)) return LOGIN_TAKEN
    throw err
  }

  revalidatePath('/staff')
  return { ok: true, message: `Сотрудник ${read.values.login} сохранён` }
}
