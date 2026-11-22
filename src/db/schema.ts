import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import type { Role } from '../lib/roles'

/*
  Схема пока минимальная: только учётные записи для входа. Таблицы
  предметной области спроектируем отдельно — логику платформы делаем
  заново, а не переносим из Global Expo.
*/

const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date())

/** Учётные записи кабинета. Пароль — scrypt с солью, сам пароль не хранится. */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Логин в нижнем регистре — вход не зависит от регистра. */
  login: text('login').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').$type<Role>().notNull(),
  salt: text('salt').notNull(),
  hash: text('hash').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

/** Неудачные попытки входа по ключу — общий лимит для всех экземпляров. */
export const loginAttempts = pgTable('login_attempts', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  until: timestamp('until', { withTimezone: true }).notNull(),
})
