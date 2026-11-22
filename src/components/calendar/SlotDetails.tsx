'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { deleteBooking } from '@/app/actions/bookings'
import { Button } from '@/components/ui/Button'
import { FileCard } from '@/components/ui/FileDrop'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { formatPeriod } from '@/lib/dates'
import { formatPercent } from '@/lib/forms'
import { textOn } from '@/lib/palette'
import { longDay } from '@/lib/week'
import type { CalendarSlot } from './types'

/** Карточка слота блоками; admin снимает бронь в два нажатия. */
export function SlotDetails({
  slot,
  canEdit,
  onClose,
  onEdit,
}: {
  slot: CalendarSlot | null
  canEdit: boolean
  onClose: () => void
  onEdit: (slot: CalendarSlot) => void
}) {
  const toast = useToast()
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition] = useTransition()

  const close = () => {
    setConfirming(false)
    onClose()
  }

  const remove = () => {
    if (!slot) return
    startTransition(async () => {
      const result = await deleteBooking(slot.id)
      if (result.ok) {
        toast.success(result.message ?? 'Бронь снята')
        close()
      } else {
        toast.error(result.error ?? 'Не удалось снять бронь')
      }
    })
  }

  return (
    <Modal
      open={slot != null}
      onClose={close}
      size="sm"
      wide
      title={slot?.formatName ?? ''}
      description={slot ? longDay(slot.date) : undefined}
      footer={
        slot ? (
          <>
            <p className="mr-auto text-xs text-ink-muted">
              Забронировал: {slot.createdBy}
            </p>
            {canEdit &&
              (confirming ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setConfirming(false)}
                    disabled={pending}
                  >
                    Отмена
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={remove}
                    disabled={pending}
                  >
                    {pending ? 'Снимаем…' : 'Да, снять бронь'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirming(true)}
                  >
                    <Trash2 size={15} />
                    Снять бронь
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      close()
                      onEdit(slot)
                    }}
                  >
                    <Pencil size={15} />
                    Изменить
                  </Button>
                </>
              ))}
          </>
        ) : undefined
      }
    >
      {slot && (
        <div className="space-y-4">
          {/* Сводка: время крупно, формат его цветом. */}
          <div
            className="flex items-center gap-4 px-4 py-3.5"
            style={{ background: slot.color, color: textOn(slot.color) }}
          >
            <span className="font-display text-[34px] font-bold leading-none tnum">
              {slot.time}
            </span>
            <span className="min-w-0 border-l border-current/25 pl-4">
              <span className="block truncate text-[15px] font-bold">
                {slot.campaignName || slot.formatName}
              </span>
              <span className="block truncate text-[12.5px] opacity-80">
                {slot.advertiserName ?? 'Без рекламодателя'} ·{' '}
                {slot.managerName}
              </span>
            </span>
          </div>

          <Block title="Размещение">
            <Item label="Дата" value={longDay(slot.date)} />
            <Item label="Время" value={slot.time} />
            <Item label="Менеджер" value={slot.managerName} />
            <Item
              label="Формат"
              value={
                <span className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0"
                    style={{ background: slot.color }}
                  />
                  {slot.formatName}
                </span>
              }
            />
          </Block>

          <Block title="Рекламодатель и договор">
            <Item label="Рекламодатель" value={slot.advertiserName ?? '—'} />
            <Item label="Рекламная кампания" value={slot.campaignName || '—'} />
            <Item
              label="Договор"
              value={slot.contractNumber ? `№ ${slot.contractNumber}` : '—'}
              mono
            />
            <Item label="Скидка" value={formatPercent(slot.contractDiscount)} />
            <Item
              label="Срок договора"
              value={formatPeriod(slot.contractStart, slot.contractEnd)}
              wide
            />
          </Block>

          {(slot.contractFile || slot.file) && (
            <Block title="Файлы" plain>
              {slot.contractFile && (
                <FileCard label="Файл договора" file={slot.contractFile} />
              )}
              {slot.file && (
                <FileCard label="Материалы слота" file={slot.file} />
              )}
            </Block>
          )}

          {slot.comment && (
            <Block title="Комментарий" plain>
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
                {slot.comment}
              </p>
            </Block>
          )}
        </div>
      )}
    </Modal>
  )
}

/** Блок карточки: подпись капсом и сетка полей в две колонки. */
function Block({
  title,
  plain,
  children,
}: {
  title: string
  /** Без сетки — для файлов и комментария. */
  plain?: boolean
  children: ReactNode
}) {
  return (
    <section className="border border-line">
      <h3 className="eyebrow flex items-center gap-2 border-b border-line bg-paper/70 px-4 py-2.5 font-mono text-ink-muted">
        <span className="h-1.5 w-1.5 bg-indigo-500" />
        {title}
      </h3>
      {plain ? (
        <div className="space-y-2 p-4">{children}</div>
      ) : (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 p-4 sm:grid-cols-2">
          {children}
        </dl>
      )}
    </section>
  )
}

function Item({
  label,
  value,
  mono,
  wide,
}: {
  label: string
  value: ReactNode
  mono?: boolean
  wide?: boolean
}) {
  return (
    <div className={cn('min-w-0', wide && 'sm:col-span-2')}>
      <dt className="eyebrow text-ink-muted">{label}</dt>
      <dd
        className={cn(
          'mt-1 truncate text-sm font-semibold text-ink',
          mono && 'font-mono text-[13px]',
        )}
      >
        {value}
      </dd>
    </div>
  )
}
