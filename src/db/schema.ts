import { sql } from 'drizzle-orm'
import {
  type AnyPgColumn,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import type { BookingStatus } from '../lib/bookings'
import type { AttachedFile } from '../lib/files'
import type { Role } from '../lib/roles'

/*
  Логика платформы проектируется заново, а не переносится из Global Expo.
  Цепочка «рекламодатель → договор → кампания» — по образцу Setanta,
  без лиг и пакетов.
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
  /** Бренд учётной записи рекламодателя: что он видит и бронирует. */
  advertiserId: uuid('advertiser_id').references(
    (): AnyPgColumn => advertisers.id,
    { onDelete: 'set null' },
  ),
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

/* ------------------------- рекламодатели и договоры ------------------------- */

/** Бренд-рекламодатель. */
export const advertisers = pgTable('advertisers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  /** Юр. лицо — подставляется в договоры бренда. */
  legalName: text('legal_name').notNull().default(''),
  contact: text('contact').notNull().default(''),
  email: text('email').notNull().default(''),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

/** Статус договора — как в Setanta. */
export type ContractStatus = 'active' | 'completed' | 'terminated'

/** Договор бренда. Кампании создаются из договора. */
export const contracts = pgTable(
  'contracts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    advertiserId: uuid('advertiser_id')
      .notNull()
      .references(() => advertisers.id),
    /** Номер уникален по всей базе: иначе один номер всплывёт у двух брендов. */
    number: text('number').notNull().unique(),
    /** Рекламная кампания, под которую заключён договор. */
    campaignName: text('campaign_name').notNull().default(''),
    legalName: text('legal_name').notNull().default(''),
    startDate: date('start_date', { mode: 'string' }),
    endDate: date('end_date', { mode: 'string' }),
    /** Сроки оплаты. */
    paymentDate: date('payment_date', { mode: 'string' }),
    status: text('status').$type<ContractStatus>().notNull().default('active'),
    /** Скидка по договору, % — подтягивается в бронь слота. */
    discount: numeric('discount', { precision: 5, scale: 2 })
      .notNull()
      .default('0'),
    /** Скан договора в приватном Blob. */
    file: jsonb('file').$type<AttachedFile>(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('contracts_advertiser_idx').on(t.advertiserId)],
)

/**
 * Рекламная кампания. Создаётся из договора бренда; срок договора
 * и юр. лицо копируются снимком — правка договора их не меняет.
 */
export const campaigns = pgTable(
  'campaigns',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    advertiserId: uuid('advertiser_id')
      .notNull()
      .references(() => advertisers.id),
    contractId: uuid('contract_id')
      .notNull()
      .references(() => contracts.id),
    name: text('name').notNull(),
    startDate: date('start_date', { mode: 'string' }).notNull(),
    endDate: date('end_date', { mode: 'string' }).notNull(),
    legalName: text('legal_name').notNull().default(''),
    contractStart: date('contract_start', { mode: 'string' }),
    contractEnd: date('contract_end', { mode: 'string' }),
    /** Кто создал — имя из сессии. */
    createdBy: text('created_by').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('campaigns_advertiser_idx').on(t.advertiserId),
    index('campaigns_contract_idx').on(t.contractId),
    check('campaigns_period_check', sql`${t.endDate} >= ${t.startDate}`),
  ],
)

/* ------------------------ календарь размещений ------------------------ */

/** Справочник форматов размещения: «Post Instagram uzb», «Anons Tg uzb»… */
export const placementFormats = pgTable('placement_formats', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  /** Цвет слота в календаре — hex из палитры справочника. */
  color: text('color').notNull(),
  /** Порядок в списках и легенде календаря. */
  position: integer('position').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

/**
 * Бронь временного слота: дата и время по Ташкенту, формат, менеджер
 * и номер заказа. Один формат в одну минуту бронируется один раз.
 */
export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    date: date('date', { mode: 'string' }).notNull(),
    /** Время слота 'HH:MM' по Ташкенту. */
    time: text('time').notNull(),
    formatId: uuid('format_id')
      .notNull()
      .references(() => placementFormats.id),
    /** Менеджер, за которым слот. Бронь рекламодателя ждёт, пока его назначат. */
    managerId: uuid('manager_id').references(() => users.id),
    /** Воронка брони: Отправлен → Получен → Рассматривается → Активен → Выполнен. */
    status: text('status').$type<BookingStatus>().notNull().default('sent'),
    /** Бренд и договор слота: из договора подтягиваются номер, скидка, файл и срок. */
    advertiserId: uuid('advertiser_id').references(() => advertisers.id),
    contractId: uuid('contract_id').references(() => contracts.id),
    /** Рекламная кампания — по умолчанию из договора, можно поправить. */
    campaignName: text('campaign_name').notNull().default(''),
    /** Материалы слота (креатив, ТЗ) в приватном Blob. */
    file: jsonb('file').$type<AttachedFile>(),
    comment: text('comment').notNull().default(''),
    createdBy: text('created_by').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('bookings_date_idx').on(t.date, t.time),
    uniqueIndex('bookings_slot_unique').on(t.formatId, t.date, t.time),
    check(
      'bookings_time_check',
      sql`${t.time} ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'`,
    ),
  ],
)
