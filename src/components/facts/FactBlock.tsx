'use client'

import {
  startTransition,
  useActionState,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from 'react'
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { deleteFact, saveFact } from '@/app/actions/facts'
import type { CalendarSlot } from '@/components/calendar/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { FileCard, FileDrop } from '@/components/ui/FileDrop'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { SelectField } from '@/components/ui/SelectField'
import { TimePicker } from '@/components/ui/TimePicker'
import { useToast } from '@/components/ui/Toast'
import { formatDay, formatMoment } from '@/lib/dates'
import { LATE_MINUTES, VERDICT, checkFact } from '@/lib/facts'
import { MAX_SCREENSHOT_BYTES } from '@/lib/files'
import type { FormState } from '@/lib/forms'

const num = (n: number) => n.toLocaleString('ru-RU')

/** Дата и время факта по Ташкенту — для полей формы. */
function localParts(moment: Date | string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tashkent',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date(moment))
      .map((p) => [p.type, p.value]),
  )
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  }
}

/** Стыковка одной публикации: план рядом с фактом, итог и форма факта. */
export function FactBlock({
  slot,
  canEdit,
  startOpen = false,
}: {
  slot: CalendarSlot
  canEdit: boolean
  /** Сразу открыть форму, если факта ещё нет. */
  startOpen?: boolean
}) {
  const { fact } = slot
  const { verdict, notes } = checkFact(slot, fact)
  const [editing, setEditing] = useState(startOpen && canEdit && !fact)
  const [round, setRound] = useState(0)
  const planImpressions = fact?.planImpressions ?? slot.planImpressions
  const published = fact?.outcome === 'published'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <Badge tone={VERDICT[verdict].tone} dot>
          {VERDICT[verdict].label}
        </Badge>
        {verdict !== 'missed' && notes.length > 0 && (
          <p className="text-[13px] text-ink-soft">{notes.join(' · ')}</p>
        )}
        {canEdit && !editing && (
          <Button
            size="sm"
            variant="secondary"
            className="ml-auto"
            onClick={() => {
              setRound((r) => r + 1)
              setEditing(true)
            }}
          >
            {fact ? <Pencil size={14} /> : <Plus size={14} />}
            {fact ? 'Изменить факт' : 'Внести факт'}
          </Button>
        )}
      </div>

      <dl className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] border border-line text-sm">
        <Head />
        <Row
          label="Выход"
          plan={`${formatDay(slot.date)}, ${slot.time}`}
          fact={
            published && fact.publishedAt
              ? formatMoment(fact.publishedAt)
              : fact
                ? 'Не вышла'
                : '—'
          }
        />
        <Row
          label="Показы"
          plan={planImpressions ? num(planImpressions) : '—'}
          fact={
            published && fact.impressions !== null ? num(fact.impressions) : '—'
          }
        />
      </dl>

      {published && fact.link && (
        <a
          href={fact.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-fit max-w-full items-center gap-2 text-sm font-semibold text-indigo-600 underline-offset-2 hover:underline focus-ring"
        >
          <ExternalLink size={15} className="shrink-0" aria-hidden="true" />
          <span className="truncate">{fact.link}</span>
        </a>
      )}
      {published && fact.screenshot && (
        <FileCard label="Скриншот" file={fact.screenshot} />
      )}
      {fact?.comment && (
        <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
          {fact.comment}
        </p>
      )}
      {fact && <p className="text-xs text-ink-muted">Внёс: {fact.createdBy}</p>}

      {editing && (
        <FactForm key={round} slot={slot} onDone={() => setEditing(false)} />
      )}
    </div>
  )
}

function Head() {
  return (
    <>
      {['', 'План', 'Факт'].map((label) => (
        <dt
          key={label}
          className="eyebrow border-b border-line bg-paper/70 px-3 py-2 text-ink-muted"
        >
          {label}
        </dt>
      ))}
    </>
  )
}

function Row({
  label,
  plan,
  fact,
}: {
  label: string
  plan: ReactNode
  fact: ReactNode
}) {
  return (
    <>
      <dt className="px-3 py-2 text-ink-muted">{label}</dt>
      <dd className="px-3 py-2 text-ink tnum">{plan}</dd>
      <dd className="px-3 py-2 font-semibold text-ink tnum">{fact}</dd>
    </>
  )
}

function FactForm({
  slot,
  onDone,
}: {
  slot: CalendarSlot
  onDone: () => void
}) {
  const { fact } = slot
  const toast = useToast()
  const [outcome, setOutcome] = useState<string>(fact?.outcome ?? 'published')
  const [confirm, setConfirm] = useState(false)
  const [removing, startRemove] = useTransition()
  const [state, action, pending] = useActionState<FormState, FormData>(
    async (prev, fd) => {
      const result = await saveFact(prev, fd)
      if (result.ok) {
        toast.success(result.message ?? 'Факт внесён')
        onDone()
      }
      return result
    },
    {},
  )
  const errors = state.errors
  const published = outcome === 'published'
  // По умолчанию — как в плане: обычно публикация выходит вовремя.
  const when = fact?.publishedAt
    ? localParts(fact.publishedAt)
    : { date: slot.date, time: slot.time }

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => action(fd))
  }

  const remove = () =>
    startRemove(async () => {
      const result = await deleteFact(slot.id)
      if (result.ok) {
        toast.success(result.message ?? 'Факт удалён')
        onDone()
      } else toast.error(result.error ?? 'Не удалось удалить')
    })

  return (
    <form
      onSubmit={submit}
      noValidate
      className="space-y-4 border border-indigo-200 bg-indigo-50/50 p-4"
    >
      <input type="hidden" name="bookingId" value={slot.id} />
      <Field label="Публикация" required>
        <SelectField
          name="outcome"
          value={outcome}
          onChange={setOutcome}
          options={[
            { value: 'published', label: 'Вышла' },
            { value: 'missed', label: 'Не вышла' },
          ]}
        />
      </Field>

      {published && (
        <>
          <div className="grid gap-4 sm:grid-cols-[1fr_130px]">
            <Field
              label="Дата выхода"
              required
              hint={`Допуск — ${LATE_MINUTES} минут от плана.`}
              error={errors?.date}
            >
              <DatePicker name="date" defaultValue={when.date} />
            </Field>
            <Field label="Время" required error={errors?.time}>
              <TimePicker name="time" defaultValue={when.time} step={1} />
            </Field>
          </div>
          <Field label="Ссылка на публикацию" error={errors?.link}>
            <Input
              name="link"
              inputMode="url"
              autoComplete="off"
              defaultValue={fact?.link}
              placeholder="https://"
              aria-invalid={!!errors?.link || undefined}
            />
          </Field>
          <Field
            label="Показы по факту"
            hint={
              slot.planImpressions
                ? `По плану ${num(fact?.planImpressions ?? slot.planImpressions)}. Можно внести позже.`
                : 'У формата нет плановых показов — не сверяются.'
            }
            error={errors?.impressions}
          >
            <MoneyInput
              name="impressions"
              decimals={0}
              defaultValue={
                fact?.impressions != null ? String(fact.impressions) : ''
              }
              invalid={!!errors?.impressions}
            />
          </Field>
          <Field group label="Скриншот">
            <FileDrop
              name="screenshot"
              folder="facts"
              accept="image/*"
              maxBytes={MAX_SCREENSHOT_BYTES}
              hint="Картинка до 15 МБ"
              defaultValue={fact?.screenshot ?? null}
            />
          </Field>
        </>
      )}

      <Field
        label={published ? 'Комментарий' : 'Почему не вышла'}
        required={!published}
        error={errors?.comment}
      >
        <Textarea
          name="comment"
          rows={2}
          defaultValue={fact?.comment}
          aria-invalid={!!errors?.comment || undefined}
        />
      </Field>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {fact &&
          (confirm ? (
            <Button
              variant="danger"
              size="sm"
              className="mr-auto"
              onClick={remove}
              disabled={removing}
            >
              {removing ? 'Удаляем…' : 'Да, удалить факт'}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="mr-auto"
              onClick={() => setConfirm(true)}
            >
              <Trash2 size={14} />
              Удалить факт
            </Button>
          ))}
        <Button
          variant="secondary"
          size="sm"
          onClick={onDone}
          disabled={pending}
        >
          Отмена
        </Button>
        <Button type="submit" size="sm" disabled={pending || removing}>
          {pending ? 'Сохраняем…' : 'Сохранить'}
        </Button>
      </div>
    </form>
  )
}
