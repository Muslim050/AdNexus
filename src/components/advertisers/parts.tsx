import type { MouseEvent, ReactNode } from 'react'
import {
  AdvertiserAccount,
  NewAdvertiserAccess,
} from '@/components/forms/AdvertiserAccess'
import { EditAdvertiser } from '@/components/forms/NewAdvertiser'
import { Badge } from '@/components/ui/Badge'
import { BrandAvatar } from '@/components/ui/BrandAvatar'
import { ADVERTISER_STATUS } from '@/lib/advertisers'
import { cn } from '@/lib/cn'
import type { AdvertiserRow } from '@/lib/data/advertisers'

/** Логотип, название и статус бренда. */
export function Brand({
  advertiser: a,
  large,
  onOpen,
}: {
  advertiser: AdvertiserRow
  large?: boolean
  onOpen: () => void
}) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <BrandAvatar
        name={a.name}
        logo={a.logo}
        color={a.color}
        size={large ? 'lg' : 'md'}
      />
      <span className="min-w-0">
        {/* Кнопка — чтобы карточка открывалась и с клавиатуры. */}
        <button
          type="button"
          onClick={onOpen}
          className={cn(
            'block text-left text-ink underline-offset-2 hover:underline focus-ring',
            large
              ? 'font-display text-[17px] font-bold leading-snug [overflow-wrap:anywhere]'
              : 'font-semibold',
          )}
        >
          {a.name}
        </button>
        <span className="mt-1 flex flex-wrap gap-1.5">
          <Badge tone={ADVERTISER_STATUS[a.status].tone} dot>
            {ADVERTISER_STATUS[a.status].label}
          </Badge>
          {a.creativeRequired && <Badge tone="warning">Ролик обязателен</Badge>}
        </span>
      </span>
    </span>
  )
}

/** Учётные записи бренда и выдача новой. */
export function Access({
  advertiser: a,
  canEdit,
}: {
  advertiser: AdvertiserRow
  canEdit: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {a.accounts.map((account) => (
        <AdvertiserAccount
          key={account.id}
          account={account}
          advertiserName={a.name}
          canEdit={canEdit}
        />
      ))}
      {canEdit && (
        <NewAdvertiserAccess advertiserId={a.id} advertiserName={a.name} />
      )}
      {!canEdit && a.accounts.length === 0 && '—'}
    </div>
  )
}

export function Edit({ advertiser }: { advertiser: AdvertiserRow }) {
  return <EditAdvertiser advertiser={advertiser} />
}

/** Номер договора кнопкой — чтобы карточка открывалась и с клавиатуры. */
export function ContractNumber({
  onOpen,
  children,
}: {
  onOpen: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="text-left underline-offset-2 hover:underline focus-ring"
    >
      {children}
    </button>
  )
}

/**
 * Клик по карточке или строке. Кнопки и ссылки внутри работают сами, а клики
 * из окон, открытых из неё, приходят сюда через портал — их не считаем.
 */
export function opensCard(e: MouseEvent<HTMLElement>) {
  const target = e.target as Element
  return (
    e.currentTarget.contains(target) &&
    !target.closest('button, a') &&
    !window.getSelection()?.toString()
  )
}
