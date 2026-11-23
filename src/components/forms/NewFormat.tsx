'use client'

import { useState } from 'react'
import { Palette, Pencil } from 'lucide-react'
import { createFormat, updateFormat } from '@/app/actions/formats'
import { Button } from '@/components/ui/Button'
import { CreateDrawer, FormDrawer } from './CreateDrawer'
import { FormatFields, type FormatInitial } from './FormatFields'

export function NewFormat({ takenColors }: { takenColors: string[] }) {
  return (
    <CreateDrawer
      label="Добавить формат"
      title="Новый формат публикации"
      description="Формат задаёт цвет слота в календаре, состав и цену публикации."
      icon={Palette}
      action={createFormat}
      submitLabel="Добавить формат"
    >
      {(state) => <FormatFields state={state} takenColors={takenColors} />}
    </CreateDrawer>
  )
}

/** Кнопка «Изменить» и панель правки формата. */
export function EditFormat({
  format,
  takenColors,
}: {
  format: FormatInitial
  takenColors: string[]
}) {
  const [open, setOpen] = useState(false)
  const [round, setRound] = useState(0)
  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          setRound((r) => r + 1)
          setOpen(true)
        }}
      >
        <Pencil size={14} />
        Изменить
      </Button>
      <FormDrawer
        open={open}
        onClose={() => setOpen(false)}
        round={round}
        title="Изменить формат"
        description={format.name}
        icon={Pencil}
        action={updateFormat}
        submitLabel="Сохранить"
      >
        {(state) => (
          <FormatFields
            state={state}
            initial={format}
            takenColors={takenColors}
          />
        )}
      </FormDrawer>
    </>
  )
}
