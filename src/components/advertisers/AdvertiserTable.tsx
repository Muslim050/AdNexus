import { Table, Td, Th, Tr } from '@/components/ui/Table'
import type { AdvertiserRow } from '@/lib/data/advertisers'
import { formatMoment } from '@/lib/dates'
import { Access, Brand, Edit, opensCard } from './parts'

export function AdvertiserTable({
  rows,
  canEdit,
  onOpen,
}: {
  rows: AdvertiserRow[]
  canEdit: boolean
  onOpen: (id: string) => void
}) {
  return (
    <Table>
      <thead>
        <tr>
          <Th className="w-px">№</Th>
          <Th>Бренд</Th>
          <Th>Юр. лицо</Th>
          <Th>Контакт</Th>
          <Th className="text-right">Договоров</Th>
          <Th>Доступ в кабинет</Th>
          <Th>Добавлен</Th>
          {canEdit && <Th>Действия</Th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((a, i) => (
          <Tr
            key={a.id}
            onClick={(e) => opensCard(e) && onOpen(a.id)}
            className="cursor-pointer"
          >
            <Td className="font-mono text-xs text-ink-muted tnum">{i + 1}</Td>
            <Td>
              <Brand advertiser={a} onOpen={() => onOpen(a.id)} />
            </Td>
            <Td>{a.legalName || '—'}</Td>
            <Td>
              {a.contact || '—'}
              {a.email && (
                <span className="block text-xs text-ink-muted">{a.email}</span>
              )}
            </Td>
            <Td className="text-right tnum">{a.contractsCount}</Td>
            <Td>
              <Access advertiser={a} canEdit={canEdit} />
            </Td>
            <Td className="tnum">{formatMoment(a.createdAt)}</Td>
            {canEdit && (
              <Td>
                <Edit advertiser={a} />
              </Td>
            )}
          </Tr>
        ))}
      </tbody>
    </Table>
  )
}
