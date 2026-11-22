'use client'

import { useState } from 'react'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { MediaUpload } from '@/components/ui/MediaUpload'
import type { AttachedFile } from '@/lib/files'
import { formatSum, type FormState } from '@/lib/forms'
import { FORMAT_COLORS, textOn } from '@/lib/palette'

export interface FormatInitial {
  id: string
  name: string
  color: string
  description: string
  includes: string
  impressions: number
  pricePerImpression: string
  media: AttachedFile[]
  isActive: boolean
}

const toNumber = (v: string) =>
  Number(v.replace(/[\s ]/g, '').replace(',', '.')) || 0

/** Поля формата размещения — для создания и правки. */
export function FormatFields({
  state,
  initial,
  takenColors,
}: {
  state: FormState
  initial?: FormatInitial
  takenColors: string[]
}) {
  const { errors } = state
  // Новому формату — первый свободный цвет, чтобы форматы различались.
  const defaultColor =
    initial?.color ??
    FORMAT_COLORS.find((c) => !takenColors.includes(c.value))?.value ??
    FORMAT_COLORS[0].value
  const [impressions, setImpressions] = useState(
    initial?.impressions ? String(initial.impressions) : '',
  )
  const [price, setPrice] = useState(
    initial && Number(initial.pricePerImpression)
      ? String(Number(initial.pricePerImpression))
      : '',
  )
  const total = toNumber(impressions) * toNumber(price)

  return (
    <>
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <Field
        label="Название"
        required
        hint="Например: Post Instagram uzb, Anons Tg uzb, PR maqola uzb."
        error={errors?.name}
      >
        <Input name="name" defaultValue={initial?.name} autoFocus={!initial} />
      </Field>

      <Field label="Описание" error={errors?.description}>
        <Textarea
          name="description"
          rows={3}
          defaultValue={initial?.description}
          placeholder="Коротко: где и как выходит размещение"
        />
      </Field>

      <Field
        label="Что входит"
        hint="По пункту на строку: пост, сторис, ссылка в шапке…"
        error={errors?.includes}
      >
        <Textarea
          name="includes"
          rows={4}
          defaultValue={initial?.includes}
          placeholder={'Пост в ленте\nСторис 24 часа\nСсылка в шапке'}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Сумма показов" error={errors?.impressions}>
          <MoneyInput
            name="impressions"
            decimals={0}
            value={impressions}
            onChange={setImpressions}
            invalid={!!errors?.impressions}
          />
        </Field>
        <Field
          label="Стоимость одного показа, сум"
          error={errors?.pricePerImpression}
        >
          <MoneyInput
            name="pricePerImpression"
            value={price}
            onChange={setPrice}
            invalid={!!errors?.pricePerImpression}
          />
        </Field>
      </div>
      <div className="flex items-center justify-between border border-line bg-paper/70 px-4 py-3">
        <span className="eyebrow text-ink-muted">Стоимость пакета</span>
        <span className="font-display text-lg font-bold text-ink tnum">
          {formatSum(total)}
        </span>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-ink-soft">
          Цвет в календаре <span className="text-danger">*</span>
        </legend>
        <div className="grid grid-cols-5 gap-2">
          {FORMAT_COLORS.map((c) => (
            <label
              key={c.value}
              title={c.label}
              className="block cursor-pointer"
            >
              <input
                type="radio"
                name="color"
                value={c.value}
                defaultChecked={c.value === defaultColor}
                className="peer sr-only"
              />
              <span
                className="flex h-10 items-center justify-center text-[11px] font-semibold ring-offset-2 transition-shadow peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500"
                style={{ background: c.value, color: textOn(c.value) }}
              >
                {c.value !== initial?.color && takenColors.includes(c.value)
                  ? 'занят'
                  : ''}
              </span>
            </label>
          ))}
        </div>
        {errors?.color && <p className="text-xs text-danger">{errors.color}</p>}
      </fieldset>

      <Field
        label="Превью: фото и видео"
        hint="До 10 файлов. Первый — обложка в справочнике."
      >
        <MediaUpload
          name="media"
          folder="formats"
          defaultValue={initial?.media ?? []}
        />
      </Field>

      {initial && (
        <label className="flex cursor-pointer items-start gap-3 border border-line px-4 py-3">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={initial.isActive}
            className="mt-0.5 h-4 w-4 accent-[var(--color-indigo-500)]"
          />
          <span>
            <span className="block text-sm font-semibold text-ink">
              Доступен для бронирования
            </span>
            <span className="block text-xs text-ink-muted">
              Отключённый формат не выбрать в новой брони; старые брони на нём
              остаются.
            </span>
          </span>
        </label>
      )}
    </>
  )
}
