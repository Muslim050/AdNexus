'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { deleteBooking, setBookingStatus } from '@/app/actions/bookings'
import { Button } from '@/components/ui/Button'
import { FileCard } from '@/components/ui/FileDrop'
import { Modal } from '@/components/ui/Modal'
import { SelectField } from '@/components/ui/SelectField'
import { useToast } from '@/components/ui/Toast'
import {
  BOOKING_STATUS,
  BOOKING_STATUSES,
  type BookingStatus,
} from '@/lib/bookings'
import { cn } from '@/lib/cn'
import { formatPeriod } from '@/lib/dates'
import { formatPercent } from '@/lib/forms'
import { textOn } from '@/lib/palette'
import type { Role } from '@/lib/roles'
import { longDay } from '@/lib/week'
import { PaymentsBlock } from './PaymentsBlock'
import { StatusChip } from './StatusChip'
import type { CalendarSlot } from './types'

/**
 * Карточка слота блоками. admin меняет статус, правит и снимает любую бронь;
 * рекламодатель правит и отменяет свою заявку, пока она «Отправлен».
 */
export function SlotDetails({
  slot,
  role,
  onClose,
  onEdit,
}: {
  slot: CalendarSlot | null
  role: Role
  onClose: () => void
  onEdit: (slot: CalendarSlot) => void
}) {
  const toast = useToast()
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition] = useTransition()
  // Статус меняется прямо в карточке — держим его локально до обновления.
  const [statusOverride, setStatusOverride] = useState<{
    id: string
    status: BookingStatus
  } | null>(null)

  const status =
    slot && statusOverride?.id === slot.id
      ? statusOverride.status
      : slot?.status
  const isAdmin = role === 'admin'
  const canChange =
    !!slot && (isAdmin || (role === 'advertiser' && status === 'sent'))

  const close = () => {
    setConfirming(false)
    setStatusOverride(null)
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

  const changeStatus = (next: string) => {
    if (!slot || next === status) return
    const previous = status
    setStatusOverride({ id: slot.id, status: next as BookingStatus })
    startTransition(async () => {
      const result = await setBookingStatus(slot.id, next)
      if (result.ok) {
        toast.success(`Статус: ${BOOKING_STATUS[next as BookingStatus].label}`)
      } else {
        if (previous) setStatusOverride({ id: slot.id, status: previous })
        toast.error(result.error ?? 'Не удалось сменить статус')
      }
    })
  }

  const removeLabel = isAdmin ? 'Снять бронь' : 'Отменить заявку'

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
            {canChange &&
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
                    {pending ? 'Удаляем…' : `Да, ${removeLabel.toLowerCase()}`}
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
                    {removeLabel}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const current = { ...slot, status: status ?? slot.status }
                      close()
                      onEdit(current)
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
      {slot && status && (
        <div className="space-y-4">
          {/* Сводка: время крупно, формат его цветом. */}
          <div
            className="flex items-center gap-4 px-4 py-3.5"
            style={{ background: slot.color, color: textOn(slot.color) }}
          >
            <span className="font-display text-[34px] font-bold leading-none tnum">
              {slot.time}
            </span>
            <span className="min-w-0 flex-1 border-l border-current/25 pl-4">
              <span className="block truncate text-[15px] font-bold">
                {slot.campaignName || slot.formatName}
              </span>
              <span className="block truncate text-[12.5px] opacity-80">
                {slot.advertiserName ?? 'Без рекламодателя'} ·{' '}
                {slot.managerName ?? 'менеджер не назначен'}
              </span>
            </span>
            <StatusChip status={status} />
          </div>

          <Block title="Статус" plain>
            {isAdmin ? (
              <div className="grid items-center gap-3 sm:grid-cols-[1fr_220px]">
                <StatusSteps status={status} />
                <SelectField
                  name="status"
                  value={status}
                  onChange={changeStatus}
                  disabled={pending}
                  options={BOOKING_STATUSES.map((s) => ({
                    value: s,
                    label: BOOKING_STATUS[s].label,
                  }))}
                />
              </div>
            ) : (
              <>
                <StatusSteps status={status} />
                {status === 'sent' && (
                  <p className="text-xs text-ink-muted">
                    Заявку можно изменить или отменить, пока менеджер её не
                    принял.
                  </p>
                )}
              </>
            )}
          </Block>

          <Block title="Оплата" plain>
            <PaymentsBlock slot={slot} canEdit={isAdmin} />
          </Block>

          <Block title="Размещение">
            <Item label="Дата" value={longDay(slot.date)} />
            <Item label="Время" value={slot.time} />
            <Item label="Менеджер" value={slot.managerName ?? 'Не назначен'} />
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

/** Воронка статусов: пройденные шаги закрашены, текущий подписан. */
function StatusSteps({ status }: { status: BookingStatus }) {
  const index = BOOKING_STATUSES.indexOf(status)
  return (
    <ol className="flex gap-1" aria-label="Этапы брони">
      {BOOKING_STATUSES.map((s, i) => (
        <li key={s} className="min-w-0 flex-1">
          <span
            className={cn(
              'block h-1.5',
              i <= index ? 'bg-indigo-500' : 'bg-ink/10',
            )}
          />
          <span
            className={cn(
              'mt-1.5 block truncate text-[11px]',
              i === index ? 'font-bold text-ink' : 'text-ink-muted',
            )}
          >
            {BOOKING_STATUS[s].label}
          </span>
        </li>
      ))}
    </ol>
  )
}

/** Блок карточки: подпись капсом и сетка полей в две колонки. */
function Block({
  title,
  plain,
  children,
}: {
  title: string
  /** Без сетки — для статуса, файлов и комментария. */
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
