/** Роли платформы: admin, viewer (только чтение), advertiser (свой бренд). */
export const ROLES = ['admin', 'viewer', 'advertiser'] as const
export type Role = (typeof ROLES)[number]

export const isRole = (value: unknown): value is Role =>
  ROLES.includes(value as Role)

/** Что о пользователе знает интерфейс. Без соли, хэша и служебных полей. */
export interface SessionUser {
  id: string
  login: string
  name: string
  role: Role
}
