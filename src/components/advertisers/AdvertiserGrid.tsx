import type { AdvertiserRow } from '@/lib/data/advertisers'
import { formatMoment } from '@/lib/dates'
import { CardItem } from './CardItem'
import { Access, Brand, Edit, opensCard } from './parts'

/** Бренды карточками: те же данные и действия, что в таблице. */
export function AdvertiserGrid({
  rows,
  canEdit,
  onOpen,
}: {
  rows: AdvertiserRow[]
  canEdit: boolean
  onOpen: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((a) => (
        <article
          key={a.id}
          onClick={(e) => opensCard(e) && onOpen(a.id)}
          className="flex min-w-0 cursor-pointer flex-col border border-line bg-surface transition-colors hover:border-indigo-500"
        >
          <div className="border-b border-line p-4">
            <Brand advertiser={a} large onOpen={() => onOpen(a.id)} />
          </div>

          <dl className="grid flex-1 grid-cols-2 content-start gap-x-4 gap-y-3.5 p-4">
            <CardItem label="Юр. лицо">{a.legalName || '—'}</CardItem>
            <CardItem label="Контакт">
              {a.contact || '—'}
              {a.email && (
                <span className="block text-xs text-ink-muted">{a.email}</span>
              )}
            </CardItem>
            <CardItem label="Договоров">{a.contractsCount}</CardItem>
            <CardItem label="Добавлен">{formatMoment(a.createdAt)}</CardItem>
            <CardItem label="Доступ в кабинет" wide>
              <Access advertiser={a} canEdit={canEdit} />
            </CardItem>
          </dl>

          {canEdit && (
            <div className="flex justify-end border-t border-line px-3 py-2">
              <Edit advertiser={a} />
            </div>
          )}
        </article>
      ))}
    </div>
  )
}
