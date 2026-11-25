'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ListOrdered, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { BrandAvatar } from '@/components/ui/BrandAvatar'
import { Block, Item } from '@/components/ui/DetailBlock'
import { FileCard } from '@/components/ui/FileDrop'
import { Modal } from '@/components/ui/Modal'
import { CONTRACT_STATUS } from '@/lib/contracts'
import type { ContractRow } from '@/lib/data/contracts'
import { formatDay, formatMoment, formatPeriod } from '@/lib/dates'
import { formatPercent } from '@/lib/forms'

/** Карточка договора: условия, файл и путь к его публикациям. */
export function ContractDetails({
  row,
  onClose,
  onEdit,
}: {
  row: ContractRow | null
  onClose: () => void
  /** Без права правки кнопки нет. */
  onEdit?: (id: string) => void
}) {
  // Пока окно закрывается, в нём остаётся последний договор.
  const [last, setLast] = useState(row)
  if (row && last !== row) setLast(row)
  const shown = row ?? last
  if (!shown) return null
  const { contract: c, advertiserName, advertiserLogo, advertiserColor } = shown
  const orders = new URLSearchParams({
    status: 'all',
    month: 'all',
    q: c.number,
  })

  return (
    <Modal
      open={row != null}
      onClose={onClose}
      size="sm"
      wide
      title={`Договор № ${c.number}`}
      description={advertiserName}
      logo={
        <BrandAvatar
          name={advertiserName}
          logo={advertiserLogo}
          color={advertiserColor}
          size="lg"
        />
      }
      footer={
        <>
          <p className="mr-auto text-xs text-ink-muted tnum">
            Добавлен: {formatMoment(c.createdAt)}
          </p>
          <Link
            href={`/orders?${orders}`}
            className="flex h-9 items-center gap-2 border border-ink/20 px-3.5 text-[13px] font-semibold text-ink transition-colors hover:border-ink focus-ring"
          >
            <ListOrdered size={15} aria-hidden="true" />
            Публикации
          </Link>
          {onEdit && (
            <Button size="sm" onClick={() => onEdit(c.id)}>
              <Pencil size={15} />
              Изменить
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <Badge tone={CONTRACT_STATUS[c.status].tone} dot>
          {CONTRACT_STATUS[c.status].label}
        </Badge>

        <Block title="Договор">
          <Item label="Рекламодатель" value={advertiserName} />
          <Item label="Юр. лицо" value={c.legalName || '—'} />
          <Item label="Рекламная кампания" value={c.campaignName || '—'} wide />
        </Block>

        <Block title="Условия">
          <Item label="Срок" value={formatPeriod(c.startDate, c.endDate)} />
          <Item label="Оплата до" value={formatDay(c.paymentDate)} />
          <Item label="Скидка" value={formatPercent(c.discount)} />
        </Block>

        <Block title="Файл" plain>
          {c.file ? (
            <FileCard label="Файл договора" file={c.file} />
          ) : (
            <p className="text-sm text-ink-muted">Не приложен</p>
          )}
        </Block>
      </div>
    </Modal>
  )
}
