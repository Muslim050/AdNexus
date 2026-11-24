'use client'

import { useState } from 'react'
import { Building2, Pencil } from 'lucide-react'
import { createAdvertiser, updateAdvertiser } from '@/app/actions/advertisers'
import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { FileDrop } from '@/components/ui/FileDrop'
import { SelectField } from '@/components/ui/SelectField'
import { SwitchRow } from '@/components/ui/Switch'
import {
  ADVERTISER_STATUS,
  BRAND_COLORS,
  type AdvertiserStatus,
} from '@/lib/advertisers'
import type { AttachedFile } from '@/lib/files'
import type { FormState } from '@/lib/forms'
import { CreateDrawer, FormDrawer } from './CreateDrawer'

export interface AdvertiserInitial {
  id: string
  name: string
  legalName: string
  contact: string
  email: string
  status: AdvertiserStatus
  creativeRequired: boolean
  requisites: string
  color: string
  logo: AttachedFile | null
}

export function NewAdvertiser() {
  return (
    <CreateDrawer
      label="Добавить рекламодателя"
      title="Новый рекламодатель"
      description="Бренд, с которым заключаются договоры."
      icon={Building2}
      action={createAdvertiser}
      submitLabel="Добавить"
    >
      {(state) => <AdvertiserFields state={state} />}
    </CreateDrawer>
  )
}

/** Кнопка «Изменить» и панель правки рекламодателя. */
export function EditAdvertiser({
  advertiser,
}: {
  advertiser: AdvertiserInitial
}) {
  const [open, setOpen] = useState(false)
  const [round, setRound] = useState(0)
  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        aria-label={`Изменить: ${advertiser.name}`}
        onClick={() => {
          setRound((r) => r + 1)
          setOpen(true)
        }}
      >
        <Pencil size={14} />
        Изменить
      </Button>
      <EditAdvertiserDrawer
        advertiser={advertiser}
        open={open}
        onClose={() => setOpen(false)}
        round={round}
      />
    </>
  )
}

/** Панель правки без кнопки — открытием управляет родитель. */
export function EditAdvertiserDrawer({
  advertiser,
  open,
  onClose,
  round,
}: {
  advertiser: AdvertiserInitial
  open: boolean
  onClose: () => void
  round: number
}) {
  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      round={round}
      title="Изменить рекламодателя"
      description={advertiser.name}
      icon={Pencil}
      action={updateAdvertiser}
      submitLabel="Сохранить"
    >
      {(state) => <AdvertiserFields state={state} initial={advertiser} />}
    </FormDrawer>
  )
}

function AdvertiserFields({
  state,
  initial,
}: {
  state: FormState
  initial?: AdvertiserInitial
}) {
  const { errors } = state
  return (
    <>
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <Field label="Название бренда" required error={errors?.name}>
        <Input name="name" defaultValue={initial?.name} autoFocus={!initial} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Контактное лицо" error={errors?.contact}>
          <Input name="contact" defaultValue={initial?.contact} />
        </Field>
        <Field label="Email" error={errors?.email}>
          <Input
            name="email"
            type="email"
            autoComplete="off"
            defaultValue={initial?.email}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Наименование юр. лица"
          hint="Подставляется в договоры бренда."
          error={errors?.legalName}
        >
          <Input
            name="legalName"
            placeholder="ООО «…»"
            defaultValue={initial?.legalName}
          />
        </Field>
        <Field
          label="Статус"
          hint="Отключённый не бронирует и не входит в кабинет."
          error={errors?.status}
        >
          <SelectField
            name="status"
            defaultValue={initial?.status ?? 'active'}
            invalid={!!errors?.status}
            options={Object.entries(ADVERTISER_STATUS).map(([value, s]) => ({
              value,
              label: s.label,
            }))}
          />
        </Field>
      </div>

      <SwitchRow
        name="creativeRequired"
        label="Рекламный ролик обязателен"
        hint="Без файла новую бронь этого рекламодателя не создать."
        defaultChecked={initial?.creativeRequired}
      />

      <Field
        label="Реквизиты"
        hint="По строке на пункт: ИНН, банк, МФО, счёт, адрес."
      >
        <Textarea
          name="requisites"
          rows={6}
          defaultValue={initial?.requisites}
          placeholder={
            'ИНН: 9 цифр\nБанк: название банка, город\nМФО: 5 цифр\nР/с: 20 цифр\nАдрес: город, улица, дом'
          }
        />
      </Field>

      <fieldset className="space-y-2">
        <legend className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-ink-soft">
          Цвет бренда
        </legend>
        <div className="flex flex-wrap gap-2.5 pt-1">
          {BRAND_COLORS.map((c) => (
            <label key={c.value} title={c.label} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={c.value}
                aria-label={c.label}
                defaultChecked={
                  c.value === (initial?.color ?? BRAND_COLORS[0].value)
                }
                className="peer sr-only"
              />
              <span
                className="block h-8 w-8 ring-offset-2 transition-shadow peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500"
                style={{ background: c.value }}
              />
            </label>
          ))}
        </div>
        {errors?.color && <p className="text-xs text-danger">{errors.color}</p>}
      </fieldset>

      <Field group label="Логотип рекламодателя" error={errors?.logo}>
        <FileDrop
          name="logo"
          folder="logos"
          accept="image/*"
          maxBytes={5 * 1024 * 1024}
          hint="PNG, JPG, WebP или SVG — до 5 МБ"
          defaultValue={initial?.logo ?? null}
        />
      </Field>
    </>
  )
}
