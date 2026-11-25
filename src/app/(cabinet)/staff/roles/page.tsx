import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Check, Minus } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Loader } from '@/components/ui/Loader'
import { SubTabs } from '@/components/ui/SubTabs'
import { Table, Td, Th, Tr } from '@/components/ui/Table'
import { requireSection } from '@/lib/auth'
import { PERMISSIONS, ROLES, ROLE_INFO } from '@/lib/roles'
import { STAFF_TABS } from '../tabs'

export const metadata: Metadata = { title: 'Роли и права' }

export default function Page() {
  return (
    <>
      <PageHeader
        title="Сотрудники и роли"
        subtitle="Что можно каждой роли. Роль сотруднику назначают на соседней вкладке."
      />
      <SubTabs tabs={STAFF_TABS} />
      <Suspense fallback={<Loader />}>
        <Roles />
      </Suspense>
    </>
  )
}

async function Roles() {
  await requireSection('/staff')
  return (
    <>
      <dl className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ROLES.map((role) => (
          <div key={role} className="border border-line bg-surface p-4">
            <dt className="font-display text-[15px] font-bold text-ink">
              {ROLE_INFO[role].label}
            </dt>
            <dd className="mt-1 text-[13px] leading-relaxed text-ink-muted">
              {ROLE_INFO[role].about}
            </dd>
          </div>
        ))}
      </dl>

      <Table>
        <thead>
          <tr>
            <Th>Что можно</Th>
            {ROLES.map((role) => (
              <Th key={role} className="text-center">
                {ROLE_INFO[role].label}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERMISSIONS.map((p) => (
            <Tr key={p.label}>
              <Td className="font-semibold text-ink">{p.label}</Td>
              {ROLES.map((role) => (
                <Td key={role} className="text-center">
                  {p.roles.includes(role) ? (
                    <>
                      <Check
                        size={17}
                        aria-hidden="true"
                        className="inline text-indigo-600"
                      />
                      <span className="sr-only">Да</span>
                    </>
                  ) : p.own?.includes(role) ? (
                    <span className="text-[13px] text-ink-soft">Свои</span>
                  ) : (
                    <>
                      <Minus
                        size={15}
                        aria-hidden="true"
                        className="inline text-ink-muted"
                      />
                      <span className="sr-only">Нет</span>
                    </>
                  )}
                </Td>
              ))}
            </Tr>
          ))}
        </tbody>
      </Table>
    </>
  )
}
