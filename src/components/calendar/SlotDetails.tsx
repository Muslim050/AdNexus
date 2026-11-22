'use client'

import { useState, useTransition } from 'react'
import { Clock, Hash, MessageSquare, Trash2, User } from 'lucide-react'
import { deleteBooking } from '@/app/actions/bookings'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { longDay } from '@/lib/week'
import type { CalendarSlot } from './types'

/** Карточка слота; admin снимает бронь в два нажатия. */
export function SlotDetails({
  slot,
  canDelete,
  onClose,
}: {
  slot: CalendarSlot | null
  canDelete: boolean
  onClose: () => void
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
      title={slot?.formatName ?? ''}
      description={slot ? longDay(slot.date) : undefined}
      footer={
        canDelete && slot ? (
          confirming ? (
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
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirming(true)}
            >
              <Trash2 size={15} />
              Снять бронь
            </Button>
          )
        ) : undefined
      }
    >
      {slot && (
        <dl className="space-y-3 text-sm">
          <div
            className="h-1.5 w-full"
            style={{ background: slot.color }}
            aria-hidden="true"
          />
          <Detail icon={Clock} label="Время" value={slot.time} />
          <Detail icon={User} label="Менеджер" value={slot.managerName} />
          <Detail
            icon={Hash}
            label="Номер заказа"
            value={slot.orderRef || '—'}
          />
          {slot.comment && (
            <Detail
              icon={MessageSquare}
              label="Комментарий"
              value={slot.comment}
            />
          )}
          <p className="pt-1 text-xs text-ink-muted">
            Забронировал: {slot.createdBy}
          </p>
        </dl>
      )}
    </Modal>
  )
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock
  label: string
  value: string
}) {
  return (
    <div className="flex gap-3">
      <Icon size={16} className="mt-0.5 shrink-0 text-ink-muted" />
      <div className="min-w-0">
        <dt className="eyebrow text-ink-muted">{label}</dt>
        <dd className="mt-0.5 whitespace-pre-line font-medium text-ink">
          {value}
        </dd>
      </div>
    </div>
  )
}
