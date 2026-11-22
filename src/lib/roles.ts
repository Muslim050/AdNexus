/** Роли платформы: admin, viewer (только чтение), advertiser (свой бренд). */
export type Role = 'admin' | 'viewer' | 'advertiser'

export interface SessionUser {
  id: string
  role: Role
  name: string
  email: string
  /** Заполнен только у роли advertiser. */
  advertiserId: string | null
}
