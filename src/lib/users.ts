import 'server-only'
import { eq } from 'drizzle-orm'
import type { AdvertiserStatus } from './advertisers'
import { getDb } from '@/db'
import { advertisers, users } from '@/db/schema'
import { checkPassword, hashPassword } from './password'
import type { SessionUser } from './roles'

type UserRow = typeof users.$inferSelect

/** Вошёл бы: запись включена, а у рекламодателя включён и бренд. */
const canSignIn = (u: UserRow, brand: AdvertiserStatus | null) =>
  u.isActive && (u.role !== 'advertiser' || brand !== 'paused')

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
  const [row] = await getDb()
    .select({ user: users, brand: advertisers.status })
    .from(users)
    .leftJoin(advertisers, eq(advertisers.id, users.advertiserId))
    .where(eq(users.login, login.trim().toLowerCase()))
    .limit(1)
  if (!row) {
    checkPassword(password, DECOY.salt, DECOY.hash)
    return null
  }
  if (!checkPassword(password, row.user.salt, row.user.hash)) return null
  return canSignIn(row.user, row.brand) ? toSessionUser(row.user) : null
}

export async function getUserById(id: string): Promise<SessionUser | null> {
  const [row] = await getDb()
    .select({ user: users, brand: advertisers.status })
    .from(users)
    .leftJoin(advertisers, eq(advertisers.id, users.advertiserId))
    .where(eq(users.id, id))
    .limit(1)
  return row && canSignIn(row.user, row.brand) ? toSessionUser(row.user) : null
}
