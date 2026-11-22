import 'server-only'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { users } from '@/db/schema'
import { checkPassword, hashPassword } from './password'
import type { SessionUser } from './roles'

type UserRow = typeof users.$inferSelect

const toSessionUser = (u: UserRow): SessionUser => ({
  id: u.id,
  login: u.login,
  name: u.name,
  role: u.role,
  advertiserId: u.advertiserId,
})

// Хэш-приманка: на неизвестный логин тратим столько же времени, сколько на
// проверку пароля, чтобы по задержке нельзя было перебрать логины.
const DECOY = hashPassword('decoy-password')

/** Логин и пароль → пользователь, если всё верно и запись активна. */
export async function verifyUser(
  login: string,
  password: string,
): Promise<SessionUser | null> {
  const [user] = await getDb()
    .select()
    .from(users)
    .where(eq(users.login, login.trim().toLowerCase()))
    .limit(1)
  if (!user) {
    checkPassword(password, DECOY.salt, DECOY.hash)
    return null
  }
  if (!checkPassword(password, user.salt, user.hash)) return null
  return user.isActive ? toSessionUser(user) : null
}

export async function getUserById(id: string): Promise<SessionUser | null> {
  const [user] = await getDb()
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
  return user?.isActive ? toSessionUser(user) : null
}
