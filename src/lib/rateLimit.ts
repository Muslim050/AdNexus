import 'server-only'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { loginAttempts } from '@/db/schema'

/**
 * Лимит попыток входа в Postgres — общий для всех экземпляров сервера.
 * Попытка считается до проверки пароля и одним запросом, поэтому
 * параллельные запросы не проскочат лимит.
 */
const WINDOW = '15 minutes'
/** Один адрес подбирает один логин: хватит человеку, ошибившемуся в пароле. */
const PER_ADDRESS = 5
/** Один логин со всех адресов: защита от подбора с многих адресов. */
const PER_LOGIN = 20

const addressKey = (ip: string, login: string) => `login:${ip}:${login}`
const loginKey = (login: string) => `login-all:${login}`

/** +1 к счётчику, новое окно — если прошлое истекло. true — в пределах лимита. */
async function consume(key: string, limit: number) {
  const [row] = await getDb()
    .insert(loginAttempts)
    .values({ key, count: 1, until: sql`now() + ${WINDOW}::interval` })
    .onConflictDoUpdate({
      target: loginAttempts.key,
      set: {
        count: sql`case when ${loginAttempts.until} < now() then 1 else ${loginAttempts.count} + 1 end`,
        until: sql`case when ${loginAttempts.until} < now() then now() + ${WINDOW}::interval else ${loginAttempts.until} end`,
      },
    })
    .returning({ count: loginAttempts.count })
  return row.count <= limit
}

/** Берёт попытку; false — отказать, не проверяя пароль. */
export async function takeLoginAttempt(ip: string, login: string) {
  return (
    (await consume(addressKey(ip, login), PER_ADDRESS)) &&
    (await consume(loginKey(login), PER_LOGIN))
  )
}

/** Верный пароль — не подбор: сбрасываем счётчик адреса и возвращаем попытку логину. */
export async function settleLoginAttempt(ip: string, login: string) {
  const db = getDb()
  await db
    .delete(loginAttempts)
    .where(eq(loginAttempts.key, addressKey(ip, login)))
  await db
    .update(loginAttempts)
    .set({ count: sql`greatest(${loginAttempts.count} - 1, 0)` })
    .where(eq(loginAttempts.key, loginKey(login)))
}
