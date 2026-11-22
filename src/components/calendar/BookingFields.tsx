'use client'

import { DatePicker } from '@/components/ui/DatePicker'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { TimePicker } from '@/components/ui/TimePicker'
import type { FormState } from '@/lib/forms'

export interface FormatChoice {
  id: string
  name: string
  color: string
  isActive: boolean
}

export interface ManagerChoice {
  id: string
  name: string
}

/** Поля брони слота. Дата приходит из дня, по которому кликнули. */
export function BookingFields({
  state,
  date,
  time,
  formats,
  managers,
  currentUserId,
}: {
  state: FormState
  date: string
  time: string
  formats: FormatChoice[]
  managers: ManagerChoice[]
  currentUserId: string
}) {
  const { errors } = state
  const active = formats.filter((f) => f.isActive)

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
        <Field label="Дата" required error={errors?.date}>
          <DatePicker
            name="date"
            defaultValue={date}
            invalid={!!errors?.date}
          />
        </Field>
        <Field label="Время" required error={errors?.time}>
          <TimePicker
            name="time"
            defaultValue={time}
            invalid={!!errors?.time}
          />
        </Field>
      </div>

      <Field label="Формат размещения" required error={errors?.formatId}>
        <Select name="formatId" defaultValue="">
          <option value="" disabled>
            Выберите формат
          </option>
          {active.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Менеджер" required error={errors?.managerId}>
        <Select
          name="managerId"
          defaultValue={
            managers.some((m) => m.id === currentUserId) ? currentUserId : ''
          }
        >
          <option value="" disabled>
            Выберите менеджера
          </option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Номер заказа"
        hint="Покажется в слоте после формата."
        error={errors?.orderRef}
      >
        <Input name="orderRef" placeholder="Например, 3047" />
      </Field>

      <Field label="Комментарий" error={errors?.comment}>
        <Textarea name="comment" rows={3} />
      </Field>
    </>
  )
}
