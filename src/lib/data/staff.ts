import 'server-only'
import { cache } from 'react'
import { asc, desc, inArray } from 'drizzle-orm'
import { getDb } from '@/db'
import { users } from '@/db/schema'
import { requireRole } from '@/lib/auth'
import { OWNERS, STAFF, type StaffRole } from '@/lib/roles'

/** Сотрудники площадки: включённые сверху. Один запрос на рендер. */
export const listStaff = cache(async () => {
  await requireRole(OWNERS)
  const rows = await getDb()
    .select({
      id: users.id,
      login: users.login,
      name: users.name,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(inArray(users.role, STAFF))
    .orderBy(desc(users.isActive), asc(users.name))
  return rows.map((r) => ({ ...r, role: r.role as StaffRole }))
})

export type StaffRow = Awaited<ReturnType<typeof listStaff>>[number]
