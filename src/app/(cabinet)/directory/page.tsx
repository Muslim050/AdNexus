import type { Metadata } from 'next'
import { BookOpen } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { NewFormat } from '@/components/forms/NewFormat'
import { EmptyState } from '@/components/ui/EmptyState'
import { Table, Td, Th, Tr } from '@/components/ui/Table'
import { requireSection } from '@/lib/auth'
import { listFormats } from '@/lib/data/formats'
import { textOn } from '@/lib/palette'

export const metadata: Metadata = { title: 'Справочник' }

export default async function Page() {
  const user = await requireSection('/directory')
  const formats = await listFormats()
  const create = user.role === 'admin' && (
    <NewFormat takenColors={formats.map((f) => f.color)} />
  )

  return (
    <>
      <PageHeader
        title="Справочник"
        subtitle="Форматы размещений и их цвета в календаре."
      >
        {formats.length > 0 && create}
      </PageHeader>

      {formats.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Форматов пока нет"
          description="Добавьте форматы размещений — без них слот в календаре не забронировать."
          action={create}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Формат</Th>
              <Th>Как выглядит в календаре</Th>
              <Th className="text-right">Броней</Th>
            </tr>
          </thead>
          <tbody>
            {formats.map((f) => (
              <Tr key={f.id}>
                <Td className="font-semibold text-ink">
                  <span className="flex items-center gap-2.5">
                    <span
                      className="h-3 w-3 shrink-0"
                      style={{ background: f.color }}
                    />
                    {f.name}
                  </span>
                </Td>
                <Td>
                  <span
                    className="inline-block max-w-[280px] truncate rounded-sm px-2 py-1 text-[12px] font-semibold"
                    style={{ background: f.color, color: textOn(f.color) }}
                  >
                    10:30 | Менеджер | {f.name}
                  </span>
                </Td>
                <Td className="text-right tnum">{f.bookingsCount}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  )
}
