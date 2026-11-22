'use client'

import {
  startTransition,
  useActionState,
  useState,
  useTransition,
  type FormEvent,
} from 'react'
import { Plus, Trash2, Wallet } from 'lucide-react'
import { addBookingPayment, deleteBookingPayment } from '@/app/actions/bookings'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { Field, Input } from '@/components/ui/Field'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { Progress } from '@/components/ui/Progress'
import { TimePicker } from '@/components/ui/TimePicker'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { formatSum, type FormState } from '@/lib/forms'
import { todayTashkent } from '@/lib/week'
import type { CalendarSlot } from './types'

const momentFmt = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Asia/Tashkent',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const nowTime = () =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tashkent',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date())

/**
 * Оплата брони, как в Setanta: сумма, оплачено, остаток и история выплат.
 * admin вносит и удаляет поступления; остальные видят только историю.
 */
export function PaymentsBlock({
  slot,
  canEdit,
}: {
  slot: CalendarSlot
  canEdit: boolean
}) {
  const amount = Number(slot.amount)
  const paid = Number(slot.paid)
  const left = amount - paid
  const pct = amount > 0 ? Math.round((paid / amount) * 100) : 0
  const [adding, setAdding] = useState(false)
  const [round, setRound] = useState(0)

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-3 gap-px border border-line bg-line">
        <Money label="Сумма" value={amount} />
        <Money label="Оплачено" value={paid} tone="success" />
        <Money
          label={left < 0 ? 'Переплата' : 'Остаток'}
          value={Math.abs(left)}
          tone={left > 0 ? 'danger' : left < 0 ? 'warning' : 'success'}
        />
      </dl>
      <div className="space-y-1.5">
        <Progress value={pct} tone={pct >= 100 ? 'success' : 'indigo'} />
        <p className="flex justify-between text-xs text-ink-muted tnum">
          <span>
            {amount > 0
              ? pct >= 100
                ? 'Оплачено полностью'
                : `Оплачено ${pct} %`
              : 'Сумма брони не указана'}
          </span>
          <span>Поступлений: {slot.payments.length}</span>
        </p>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="eyebrow text-ink-muted">История выплат</p>
          {canEdit && !adding && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setRound((r) => r + 1)
                setAdding(true)
              }}
            >
              <Plus size={14} />
              Внести оплату
            </Button>
          )}
        </div>

        {canEdit && adding && (
          <PaymentForm
            key={round}
            bookingId={slot.id}
            suggested={left > 0 ? left : 0}
            onDone={() => setAdding(false)}
          />
        )}

        {slot.payments.length === 0 ? (
          <p className="bg-hatch px-4 py-5 text-center text-sm text-ink-muted">
            Поступлений пока нет
          </p>
        ) : (
          <ol className="divide-y divide-line border border-line">
            {slot.payments.map((p, i) => (
              <PaymentRow
                key={p.id}
                index={i + 1}
                payment={p}
                canDelete={canEdit}
              />
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}

function Money({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'success' | 'danger' | 'warning'
}) {
  return (
    <div className="bg-surface px-3 py-2.5">
      <dt className="eyebrow text-ink-muted">{label}</dt>
      <dd
        className={cn(
          'mt-0.5 truncate font-display text-[16px] font-bold tnum',
          tone === 'success' && 'text-success',
          tone === 'danger' && 'text-danger',
          tone === 'warning' && 'text-warning',
          !tone && 'text-ink',
        )}
      >
        {formatSum(value)}
      </dd>
    </div>
  )
}

function PaymentRow({
  index,
  payment,
  canDelete,
}: {
  index: number
  payment: CalendarSlot['payments'][number]
  canDelete: boolean
}) {
  const toast = useToast()
  const [confirm, setConfirm] = useState(false)
  const [pending, start] = useTransition()

  const remove = () =>
    start(async () => {
      const result = await deleteBookingPayment(payment.id)
      if (result.ok) toast.success(result.message ?? 'Удалено')
      else toast.error(result.error ?? 'Не удалось удалить')
    })

  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-success/10 font-mono text-[11px] font-bold text-success">
        {String(index).padStart(2, '0')}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink tnum">
          + {formatSum(payment.amount)}
        </p>
        <p className="truncate text-xs text-ink-muted">
          {momentFmt.format(new Date(payment.paidAt))} · {payment.createdBy}
          {payment.comment && ` · ${payment.comment}`}
        </p>
      </div>
      {canDelete &&
        (confirm ? (
          <span className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => setConfirm(false)}
              className="px-2 py-1 text-xs font-semibold text-ink-muted hover:text-ink"
            >
              Нет
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="bg-danger px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
            >
              {pending ? '…' : 'Удалить'}
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirm(true)}
            aria-label="Удалить поступление"
            className="flex h-8 w-8 shrink-0 items-center justify-center text-ink-muted hover:bg-danger/8 hover:text-danger focus-ring"
          >
            <Trash2 size={15} />
          </button>
        ))}
    </li>
  )
}

function PaymentForm({
  bookingId,
  suggested,
  onDone,
}: {
  bookingId: string
  suggested: number
  onDone: () => void
}) {
  const toast = useToast()
  const [state, action, pending] = useActionState<FormState, FormData>(
    async (prev, fd) => {
      const result = await addBookingPayment(prev, fd)
      if (result.ok) {
        toast.success(result.message ?? 'Внесено')
        onDone()
      }
      return result
    },
    {},
  )
  const errors = state.errors

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => action(fd))
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="mb-3 space-y-4 border border-indigo-200 bg-indigo-50/50 p-4"
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Wallet size={16} className="text-indigo-600" />
        Новое поступление
      </p>
      <input type="hidden" name="bookingId" value={bookingId} />
      <Field label="Сумма, сум" required error={errors?.amount}>
        <MoneyInput
          name="amount"
          defaultValue={suggested ? String(suggested) : ''}
          invalid={!!errors?.amount}
          autoFocus
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-[1fr_130px]">
        <Field label="Дата оплаты" required error={errors?.date}>
          <DatePicker name="date" defaultValue={todayTashkent()} />
        </Field>
        <Field label="Время" required error={errors?.time}>
          <TimePicker name="time" defaultValue={nowTime()} step={1} />
        </Field>
      </div>
      <Field label="Комментарий">
        <Input name="comment" placeholder="Например: предоплата 50 %" />
      </Field>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onDone}
          disabled={pending}
        >
          Отмена
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Вносим…' : 'Внести'}
        </Button>
      </div>
    </form>
  )
}
