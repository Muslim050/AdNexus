/**
 * Стартовые учётные записи.
 *
 *   npm run db:seed   добавить демо-пользователей, если их ещё нет
 *
 * Существующие записи не трогаем. Пароль демо-входов совпадает с логином —
 * для продакшена задайте ADMIN_PASSWORD.
 */
import { getDb } from '../src/db'
import { users } from '../src/db/schema'
import { hashPassword } from '../src/lib/password'
import type { Role } from '../src/lib/roles'

const DEMO_USERS: { login: string; name: string; role: Role }[] = [
  { login: 'admin', name: 'Администратор', role: 'admin' },
  { login: 'viewer', name: 'Наблюдатель', role: 'viewer' },
]

async function main() {
  const db = getDb()
  for (const u of DEMO_USERS) {
    const password =
      u.login === 'admin' && process.env.ADMIN_PASSWORD
        ? process.env.ADMIN_PASSWORD
        : u.login
    const added = await db
      .insert(users)
      .values({ ...u, ...hashPassword(password) })
      .onConflictDoNothing()
      .returning({ login: users.login })
    console.log(added.length ? `Добавлен: ${u.login}` : `Уже есть: ${u.login}`)
  }
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e)
    process.exit(1)
  },
)
