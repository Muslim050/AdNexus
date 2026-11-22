import 'server-only'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

/**
 * Клиент создаётся лениво, чтобы `next build` не требовал DATABASE_URL.
 * HTTP-драйвер Neon без состояния — одного клиента на процесс достаточно.
 */
function createDb() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL не задан. Выполните `vercel env pull .env.local` или подключите базу Neon.',
    )
  }
  const sql = neon(url)
  return { db: drizzle(sql, { schema }), sql }
}

let client: ReturnType<typeof createDb> | null = null

export function getDb() {
  client ??= createDb()
  return client.db
}

/** Сырой SQL тегированным шаблоном — для редких запросов вне Drizzle. */
export function getSql() {
  client ??= createDb()
  return client.sql
}

export { schema }
