'use client'

import { useState, useTransition } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { deleteBooking, setBookingStatus } from '@/app/actions/bookings'
import { BrandAvatar } from '@/components/ui/BrandAvatar'
import { FactBlock } from '@/components/facts/FactBlock'
import { Button } from '@/components/ui/Button'
import { Block, Item } from '@/components/ui/DetailBlock'
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
import { isEditor, type Role } from '@/lib/roles'
import { useNow } from '@/lib/useNow'
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
  // Последняя смена статуса в этой карточке — её можно отменить.
  const [changed, setChanged] = useState<{
    id: string
    from: BookingStatus
  } | null>(null)

  const status =
    slot && statusOverride?.id === slot.id
      ? statusOverride.status
      : slot?.status
  const canManage = isEditor(role)
  // Стыковка — когда время по плану прошло или факт уже внесён.
  const now = useNow()
  const hasFact =
    !!slot &&
    (!!slot.fact ||
      (canManage &&
        !!now &&
        `${slot.date} ${slot.time}` <= `${now.date} ${now.time}`))
  const canChange =
    !!slot && (canManage || (role === 'advertiser' && status === 'sent'))

  const close = () => {
    setConfirming(false)
    setStatusOverride(null)
    setChanged(null)
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

  const changeStatus = (next: string, undo = false) => {
    if (!slot || !status || next === status) return
    const previous = status
    setStatusOverride({ id: slot.id, status: next as BookingStatus })
    startTransition(async () => {
      const result = await setBookingStatus(slot.id, next)
      if (result.ok) {
        // Подтверждение — строкой под списком: там же и «Отменить».
        setChanged(undo ? null : { id: slot.id, from: previous })
      } else {
        setStatusOverride({ id: slot.id, status: previous })
        toast.error(result.error ?? 'Не удалось сменить статус')
      }
    })
  }
  const undone = changed && slot && changed.id === slot.id ? changed : null

  const removeLabel = canManage ? 'Снять бронь' : 'Отменить заявку'

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
            <p className="mr-auto text-xs text-ink-muted max-sm:w-full">
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
                  {slot.payments.length > 0 || slot.fact ? (
                    // С бронью пропали бы выплаты и стыковка — снять не даём.
                    <span className="text-xs leading-snug text-ink-muted max-sm:mr-auto max-sm:max-w-[170px] sm:max-w-[210px] sm:text-right">
                      {slot.fact
                        ? 'Внесён факт — снять бронь нельзя'
                        : 'Есть поступления — снять бронь нельзя'}
                    </span>
                  ) : (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setConfirming(true)}
                    >
                      <Trash2 size={15} />
                      {removeLabel}
                    </Button>
                  )}
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
            className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5 sm:flex-nowrap"
            style={{ background: slot.color, color: textOn(slot.color) }}
          >
            <span className="font-display text-[34px] font-bold leading-none tnum">
              {slot.time}
            </span>
            <span className="order-last flex min-w-0 basis-full items-center gap-3 border-current/25 max-sm:border-t max-sm:pt-3 sm:order-none sm:flex-1 sm:basis-auto sm:border-l sm:pl-4">
              {slot.advertiserName && (
                <BrandAvatar
                  name={slot.advertiserName}
                  logo={slot.advertiserLogo}
                  color={slot.advertiserColor}
                />
              )}
              <span className="min-w-0">
                <span className="block text-[15px] font-bold [overflow-wrap:anywhere] sm:truncate">
                  {slot.campaignName || slot.formatName}
                </span>
                <span className="block text-[12.5px] [overflow-wrap:anywhere] sm:truncate">
                  {slot.advertiserName ?? 'Без рекламодателя'} ·{' '}
                  {slot.managerName ?? 'менеджер не назначен'}
                </span>
              </span>
            </span>
            <StatusChip status={status} />
          </div>

          <Block title="Статус" plain>
            {canManage ? (
              <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
                <StatusSteps status={status} />
                <SelectField
                  name="status"
                  label="Статус брони"
                  value={status}
                  onChange={(next) => changeStatus(next)}
                  disabled={pending}
                  options={BOOKING_STATUSES.map((s) => ({
                    value: s,
                    label: BOOKING_STATUS[s].label,
                  }))}
                />
              </div>
            ) : null}
            {canManage && (
              <p
                role="status"
                className="flex min-h-5 flex-wrap items-center gap-x-2 text-[13px] text-ink-soft"
              >
                {undone && (
                  <>
                    Статус изменён: {BOOKING_STATUS[undone.from].label} →{' '}
                    {BOOKING_STATUS[status].label}.
                    <button
                      type="button"
                      onClick={() => changeStatus(undone.from, true)}
                      disabled={pending}
                      className="font-semibold text-indigo-600 underline-offset-2 hover:underline focus-ring"
                    >
                      Отменить
                    </button>
                  </>
                )}
              </p>
            )}
            {!canManage && (
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
            <PaymentsBlock slot={slot} canEdit={canManage} />
          </Block>

          {hasFact && (
            <Block title="Стыковка" plain>
              <FactBlock key={slot.id} slot={slot} canEdit={canManage} />
            </Block>
          )}

          <Block title="Публикация">
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
    <div>
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
                'mt-1.5 block truncate text-[11px] max-sm:sr-only',
                i === index ? 'font-bold text-ink' : 'text-ink-muted',
              )}
            >
              {BOOKING_STATUS[s].label}
            </span>
          </li>
        ))}
      </ol>
      {/* На телефоне пять подписей не помещаются — называем только текущую. */}
      <p
        aria-hidden="true"
        className="mt-2 text-[13px] font-bold text-ink sm:hidden"
      >
        {BOOKING_STATUS[status].label}{' '}
        <span className="font-normal text-ink-muted tnum">
          · шаг {index + 1} из {BOOKING_STATUSES.length}
        </span>
      </p>
    </div>
  )
}
