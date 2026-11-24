'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { BrandAvatar } from '@/components/ui/BrandAvatar'
import { Button } from '@/components/ui/Button'
import { Block, Item } from '@/components/ui/DetailBlock'
import { FileLink } from '@/components/ui/FileDrop'
import { Modal } from '@/components/ui/Modal'
import type { ContractStatus } from '@/db/schema'
import { ADVERTISER_STATUS } from '@/lib/advertisers'
import { CONTRACT_STATUS } from '@/lib/contracts'
import type { AdvertiserRow } from '@/lib/data/advertisers'
import { formatMoment, formatPeriod } from '@/lib/dates'
import type { AttachedFile } from '@/lib/files'
import { formatPercent } from '@/lib/forms'

export interface BrandContract {
  id: string
  advertiserId: string
  number: string
  campaignName: string
  startDate: string | null
  endDate: string | null
  status: ContractStatus
  discount: string
  file: AttachedFile | null
}

/** Карточка бренда: данные, реквизиты, договоры и доступы. */
export function AdvertiserDetails({
  advertiser,
  contracts,
  onClose,
  onEdit,
}: {
  advertiser: AdvertiserRow | null
  contracts: BrandContract[]
  onClose: () => void
  /** Без права правки кнопки нет. */
  onEdit?: (id: string) => void
}) {
  // Пока окно закрывается, в нём остаётся последний бренд.
  const [last, setLast] = useState({ advertiser, contracts })
  if (advertiser && last.advertiser !== advertiser)
    setLast({ advertiser, contracts })
  const a = advertiser ?? last.advertiser
  const list = advertiser ? contracts : last.contracts
  if (!a) return null

  return (
    <Modal
      open={advertiser != null}
      onClose={onClose}
      size="sm"
      wide
      title={a.name}
      description={a.legalName || undefined}
      logo={
        <BrandAvatar name={a.name} logo={a.logo} color={a.color} size="lg" />
      }
      footer={
        <>
          <p className="mr-auto text-xs text-ink-muted tnum">
            Добавлен: {formatMoment(a.createdAt)}
          </p>
          {onEdit && (
            <Button size="sm" onClick={() => onEdit(a.id)}>
              <Pencil size={15} />
              Изменить
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={ADVERTISER_STATUS[a.status].tone} dot>
            {ADVERTISER_STATUS[a.status].label}
          </Badge>
          {a.creativeRequired && <Badge tone="warning">Ролик обязателен</Badge>}
        </div>

        <Block title="Рекламодатель">
          <Item label="Юр. лицо" value={a.legalName || '—'} />
          <Item label="Контакт" value={a.contact || '—'} />
          <Item label="Почта" value={a.email || '—'} />
          <Item label="Договоров" value={String(list.length)} />
        </Block>

        <Block title="Реквизиты" plain>
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink [overflow-wrap:anywhere]">
            {a.requisites || 'Не указаны'}
          </p>
        </Block>

        <Block title="Договоры" plain>
          {list.length === 0 ? (
            <p className="text-sm text-ink-muted">Договоров пока нет</p>
          ) : (
            <ul className="divide-y divide-line">
              {list.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[13px] font-semibold text-ink">
                      № {c.number}
                    </p>
                    <p className="text-sm text-ink-soft [overflow-wrap:anywhere]">
                      {c.campaignName || 'Кампания не указана'}
                    </p>
                    <p className="text-xs text-ink-muted tnum">
                      {formatPeriod(c.startDate, c.endDate)} · скидка{' '}
                      {formatPercent(c.discount)}
                    </p>
                    {c.file && <FileLink file={c.file} />}
                  </div>
                  <Badge tone={CONTRACT_STATUS[c.status].tone} dot>
                    {CONTRACT_STATUS[c.status].label}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Block>

        <Block title="Доступ в кабинет" plain>
          {a.accounts.length === 0 ? (
            <p className="text-sm text-ink-muted">Доступ ещё не выдан</p>
          ) : (
            <ul className="divide-y divide-line">
              {a.accounts.map((u) => (
                <li
                  key={u.id}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[13px] font-semibold text-ink">
                      {u.login}
                    </p>
                    <p className="text-xs text-ink-muted [overflow-wrap:anywhere]">
                      {[`${u.firstName} ${u.lastName}`.trim(), u.email, u.phone]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </p>
                  </div>
                  <Badge tone={u.isActive ? 'success' : 'muted'} dot>
                    {u.isActive ? 'Включён' : 'Отключён'}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Block>
      </div>
    </Modal>
  )
}
