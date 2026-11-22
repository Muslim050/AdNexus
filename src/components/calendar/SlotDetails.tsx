'use client'

import { useState, useTransition, type ReactNode } from 'react'
import {
  Building2,
  CalendarRange,
  Clock,
  FileText,
  Megaphone,
  MessageSquare,
  Paperclip,
  Percent,
  Trash2,
  User,
} from 'lucide-react'
import { FileLink } from '@/components/ui/FileDrop'
import { formatPeriod } from '@/lib/dates'
import { formatPercent } from '@/lib/forms'
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
            icon={Megaphone}
            label="Рекламная кампания"
            value={slot.campaignName || '—'}
          />
          {slot.advertiserName && (
            <Detail
              icon={Building2}
              label="Рекламодатель"
              value={slot.advertiserName}
            />
          )}
          {slot.contractNumber && (
            <>
              <Detail
                icon={FileText}
                label="Договор"
                value={`№ ${slot.contractNumber}`}
              />
              <Detail
                icon={Percent}
                label="Скидка"
                value={formatPercent(slot.contractDiscount)}
              />
              <Detail
                icon={CalendarRange}
                label="Срок договора"
                value={formatPeriod(slot.contractStart, slot.contractEnd)}
              />
            </>
          )}
          {slot.contractFile && (
            <FileRow label="Файл договора">
              <FileLink file={slot.contractFile} />
            </FileRow>
          )}
          {slot.file && (
            <FileRow label="Файл">
              <FileLink file={slot.file} />
            </FileRow>
          )}
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

function FileRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <Paperclip size={16} className="mt-0.5 shrink-0 text-ink-muted" />
      <div className="min-w-0">
        <dt className="eyebrow text-ink-muted">{label}</dt>
        <dd className="mt-0.5 min-w-0">{children}</dd>
      </div>
    </div>
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
