import type { SessionUser } from './roles'

/**
 * ВРЕМЕННО: до подключения Better Auth (этап 3) кабинет открыт под
 * демо-администратором. Когда появится авторизация, функция будет читать
 * сессию из cookie и возвращать null для гостя.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  return {
    id: 'demo-admin',
    role: 'admin',
    name: 'Администратор',
    email: 'admin@adnexus.local',
    advertiserId: null,
  }
}
