import { Badge } from '@/components/ui/Badge'
import { BrandAvatar } from '@/components/ui/BrandAvatar'
import { FileLink } from '@/components/ui/FileDrop'
import { CONTRACT_STATUS } from '@/lib/contracts'
import type { ContractRow } from '@/lib/data/contracts'
import { formatDay, formatPeriod } from '@/lib/dates'
import { formatPercent } from '@/lib/forms'
import { CardItem } from './CardItem'
import { ContractNumber, opensCard } from './parts'

/** Договоры карточками: те же данные, что в таблице. */
export function ContractGrid({
  rows,
  onOpen,
}: {
  rows: ContractRow[]
  onOpen: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2 xl:grid-cols-3">
      {rows.map(
        ({ contract: c, advertiserName, advertiserLogo, advertiserColor }) => (
          <article
            key={c.id}
            onClick={(e) => opensCard(e) && onOpen(c.id)}
            className="flex min-w-0 cursor-pointer flex-col border border-line bg-surface transition-colors hover:border-indigo-500"
          >
            <div className="flex items-center gap-3 border-b border-line p-4">
              <BrandAvatar
                name={advertiserName}
                logo={advertiserLogo}
                color={advertiserColor}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[15px] font-semibold text-ink [overflow-wrap:anywhere]">
                  <ContractNumber onOpen={() => onOpen(c.id)}>
                    № {c.number}
                  </ContractNumber>
                </p>
                <p className="truncate text-sm text-ink-soft">
                  {advertiserName}
                </p>
              </div>
              <Badge tone={CONTRACT_STATUS[c.status].tone} dot>
                {CONTRACT_STATUS[c.status].label}
              </Badge>
            </div>

            <dl className="grid flex-1 grid-cols-2 content-start gap-x-4 gap-y-3.5 p-4">
              <CardItem label="Рекламная кампания" wide>
                {c.campaignName || '—'}
              </CardItem>
              <CardItem label="Срок" wide>
                {formatPeriod(c.startDate, c.endDate)}
              </CardItem>
              <CardItem label="Оплата до">{formatDay(c.paymentDate)}</CardItem>
              <CardItem label="Скидка">{formatPercent(c.discount)}</CardItem>
              <CardItem label="Файл" wide>
                {c.file ? <FileLink file={c.file} /> : '—'}
              </CardItem>
            </dl>
          </article>
        ),
      )}
    </div>
  )
}
