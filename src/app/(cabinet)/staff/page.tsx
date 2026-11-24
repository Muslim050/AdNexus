import { Suspense } from 'react'
import type { Metadata } from 'next'
import { EditStaff, NewStaff } from '@/components/forms/StaffForm'
import { PageHeader } from '@/components/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Loader } from '@/components/ui/Loader'
import { SubTabs } from '@/components/ui/SubTabs'
import { Table, Td, Th, Tr } from '@/components/ui/Table'
import { requireSection } from '@/lib/auth'
import { listStaff } from '@/lib/data/staff'
import { formatMoment } from '@/lib/dates'
import { formatPhone } from '@/lib/phone'
import { ROLE_INFO, type StaffRole } from '@/lib/roles'
import { STAFF_TABS } from './tabs'

export const metadata: Metadata = { title: 'Сотрудники и роли' }

const ROLE_TONE: Record<StaffRole, BadgeTone> = {
  admin: 'success',
  manager: 'indigo',
  viewer: 'muted',
}

export default function Page() {
  return (
    <>
      <PageHeader
        title="Сотрудники и роли"
        subtitle="Кто работает на площадке и что ему можно."
      >
        <Suspense>
          <CreateAction />
        </Suspense>
      </PageHeader>
      <SubTabs tabs={STAFF_TABS} />
      <Suspense fallback={<Loader />}>
        <Staff />
      </Suspense>
    </>
  )
}

async function CreateAction() {
  await requireSection('/staff')
  return <NewStaff />
}

async function Staff() {
  const me = await requireSection('/staff')
  const rows = await listStaff()

  return (
    <Table>
      <thead>
        <tr>
          <Th>Сотрудник</Th>
          <Th>Роль</Th>
          <Th>Контакт</Th>
          <Th>Статус</Th>
          <Th>Добавлен</Th>
          <Th>Действия</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((u) => (
          <Tr key={u.id}>
            <Td>
              <span className="flex items-center gap-3">
                <Avatar name={u.name} />
                <span className="min-w-0">
                  <span className="block font-semibold text-ink">
                    {u.name}
                    {u.id === me.id && (
                      <span className="font-normal text-ink-muted"> · вы</span>
                    )}
                  </span>
                  <span className="block font-mono text-xs text-ink-muted">
                    {u.login}
                  </span>
                </span>
              </span>
            </Td>
            <Td>
              <Badge tone={ROLE_TONE[u.role]}>{ROLE_INFO[u.role].label}</Badge>
            </Td>
            <Td className="tnum">
              {u.phone || u.email ? (
                <>
                  {u.phone && (
                    <span className="block">{formatPhone(u.phone)}</span>
                  )}
                  {u.email && (
                    <span className="block text-xs text-ink-muted">
                      {u.email}
                    </span>
                  )}
                </>
              ) : (
                '—'
              )}
            </Td>
            <Td>
              <Badge tone={u.isActive ? 'success' : 'muted'} dot>
                {u.isActive ? 'Активен' : 'Отключён'}
              </Badge>
            </Td>
            <Td className="tnum">{formatMoment(u.createdAt)}</Td>
            <Td>
              <EditStaff
                isSelf={u.id === me.id}
                staff={{
                  id: u.id,
                  login: u.login,
                  firstName: u.firstName,
                  lastName: u.lastName,
                  email: u.email,
                  phone: u.phone,
                  isActive: u.isActive,
                  role: u.role,
                }}
              />
            </Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  )
}
