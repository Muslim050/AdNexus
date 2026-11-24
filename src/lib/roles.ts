/**
 * Роли платформы. Сотрудники: admin — всё, manager — вся работа с бронями,
 * брендами и справочником, viewer — только просмотр. advertiser — свой бренд.
 */
export const ROLES = ['admin', 'manager', 'viewer', 'advertiser'] as const
export type Role = (typeof ROLES)[number]

/** Сотрудники площадки. */
export const STAFF = ['admin', 'manager', 'viewer'] as const
export type StaffRole = (typeof STAFF)[number]
/** Ведут брони, бренды, договоры и справочник. */
export const EDITORS = ['admin', 'manager'] as const
/** Бронируют: рекламодатель — только за свой бренд. */
export const BOOKERS = ['admin', 'manager', 'advertiser'] as const
/** Сотрудники и роли — только admin: иначе менеджер выдал бы себе любую. */
export const OWNERS = ['admin'] as const

export const isRole = (value: unknown): value is Role =>
  ROLES.includes(value as Role)
export const isStaffRole = (value: unknown): value is StaffRole =>
  STAFF.includes(value as StaffRole)
export const isEditor = (role: Role) =>
  (EDITORS as readonly Role[]).includes(role)

export const ROLE_INFO: Record<Role, { label: string; about: string }> = {
  admin: {
    label: 'Администратор',
    about: 'Полный доступ, включая сотрудников и роли.',
  },
  manager: {
    label: 'Менеджер',
    about: 'Вся работа как у администратора, кроме сотрудников и ролей.',
  },
  viewer: { label: 'Наблюдатель', about: 'Видит всё, но ничего не меняет.' },
  advertiser: {
    label: 'Рекламодатель',
    about: 'Только свой бренд: свои заявки, договоры и оплаты.',
  },
}

/** Что кому можно — для вкладки «Роли и права». own — только своё. */
export const PERMISSIONS: {
  label: string
  roles: readonly Role[]
  own?: readonly Role[]
}[] = [
  { label: 'Смотреть календарь и заказы', roles: STAFF, own: ['advertiser'] },
  { label: 'Бронировать слоты', roles: EDITORS, own: ['advertiser'] },
  {
    label: 'Менять и снимать брони',
    roles: EDITORS,
    own: ['advertiser'],
  },
  { label: 'Менять статусы броней', roles: EDITORS },
  { label: 'Вносить и удалять выплаты', roles: EDITORS },
  { label: 'Смотреть стыковку публикаций', roles: STAFF, own: ['advertiser'] },
  { label: 'Вносить факт публикации', roles: EDITORS },
  { label: 'Смотреть бренды, договоры и справочник', roles: STAFF },
  { label: 'Добавлять и менять бренды, добавлять договоры', roles: EDITORS },
  { label: 'Выдавать доступ рекламодателям', roles: EDITORS },
  { label: 'Менять форматы и цены в справочнике', roles: EDITORS },
  { label: 'Добавлять сотрудников и менять роли', roles: OWNERS },
]

/** Что о пользователе знает интерфейс. Без соли, хэша и служебных полей. */
export interface SessionUser {
  id: string
  login: string
  name: string
  role: Role
  /** Бренд рекламодателя; у сотрудников — null. */
  advertiserId: string | null
}
