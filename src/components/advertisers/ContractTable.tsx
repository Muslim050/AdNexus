import { Badge } from '@/components/ui/Badge'
import { FileLink } from '@/components/ui/FileDrop'
import { Table, Td, Th, Tr } from '@/components/ui/Table'
import { CONTRACT_STATUS } from '@/lib/contracts'
import type { ContractRow } from '@/lib/data/contracts'
import { formatDay, formatPeriod } from '@/lib/dates'
import { formatPercent } from '@/lib/forms'
import { ContractNumber, opensCard } from './parts'

export function ContractTable({
  rows,
  onOpen,
}: {
  rows: ContractRow[]
  onOpen: (id: string) => void
}) {
  return (
    <Table>
      <thead>
        <tr>
          <Th className="w-px">№</Th>
          <Th>Договор</Th>
          <Th>Рекламодатель</Th>
          <Th>Рекламная кампания</Th>
          <Th>Срок</Th>
          <Th>Оплата до</Th>
          <Th className="text-right">Скидка</Th>
          <Th>Файл</Th>
          <Th>Статус</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ contract: c, advertiserName }, i) => (
          <Tr
            key={c.id}
            onClick={(e) => opensCard(e) && onOpen(c.id)}
            className="cursor-pointer"
          >
            <Td className="font-mono text-xs text-ink-muted tnum">{i + 1}</Td>
            <Td className="font-mono text-[13px] font-semibold text-ink">
              <ContractNumber onOpen={() => onOpen(c.id)}>
                {c.number}
              </ContractNumber>
            </Td>
            <Td className="text-ink">{advertiserName}</Td>
            <Td>{c.campaignName || '—'}</Td>
            <Td className="tnum">{formatPeriod(c.startDate, c.endDate)}</Td>
            <Td className="tnum">{formatDay(c.paymentDate)}</Td>
            <Td className="text-right tnum">{formatPercent(c.discount)}</Td>
            <Td className="max-w-[200px]">
              {c.file ? <FileLink file={c.file} /> : '—'}
            </Td>
            <Td>
              <Badge tone={CONTRACT_STATUS[c.status].tone} dot>
                {CONTRACT_STATUS[c.status].label}
              </Badge>
            </Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  )
}
