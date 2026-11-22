'use client'

import { Palette } from 'lucide-react'
import { createFormat } from '@/app/actions/formats'
import { Field, Input } from '@/components/ui/Field'
import { FORMAT_COLORS, textOn } from '@/lib/palette'
import { CreateDrawer } from './CreateDrawer'

export function NewFormat({ takenColors }: { takenColors: string[] }) {
  // Первый ещё не занятый цвет — по умолчанию, чтобы форматы различались.
  const initial =
    FORMAT_COLORS.find((c) => !takenColors.includes(c.value))?.value ??
    FORMAT_COLORS[0].value

  return (
    <CreateDrawer
      label="Добавить формат"
      title="Новый формат размещения"
      description="Формат задаёт цвет слота в календаре размещений."
      icon={Palette}
      action={createFormat}
      submitLabel="Добавить формат"
    >
      {({ errors }) => (
        <>
          <Field
            label="Название"
            required
            hint="Например: Post Instagram uzb, Anons Tg uzb, PR maqola uzb."
            error={errors?.name}
          >
            <Input name="name" autoFocus />
          </Field>
          <fieldset className="space-y-2">
            <legend className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-ink-soft">
              Цвет в календаре <span className="text-danger">*</span>
            </legend>
            <div className="grid grid-cols-5 gap-2">
              {FORMAT_COLORS.map((c) => (
                <label
                  key={c.value}
                  title={c.label}
                  className="group relative block cursor-pointer"
                >
                  <input
                    type="radio"
                    name="color"
                    value={c.value}
                    defaultChecked={c.value === initial}
                    className="peer sr-only"
                  />
                  <span
                    className="flex h-10 items-center justify-center text-[11px] font-semibold ring-offset-2 transition-shadow peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500"
                    style={{ background: c.value, color: textOn(c.value) }}
                  >
                    {takenColors.includes(c.value) ? 'занят' : ''}
                  </span>
                </label>
              ))}
            </div>
            {errors?.color && (
              <p className="text-xs text-danger">{errors.color}</p>
            )}
          </fieldset>
        </>
      )}
    </CreateDrawer>
  )
}
