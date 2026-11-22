'use client'

import {
  startTransition,
  useActionState,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { Plus, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import type { FormState } from '@/lib/forms'

type Action = (prev: FormState, fd: FormData) => Promise<FormState>

interface CreateDrawerProps {
  /** Надпись на кнопке, открывающей панель. */
  label: string
  title: string
  description?: string
  icon: LucideIcon
  action: Action
  submitLabel: string
  /** Кнопку можно заблокировать — например, пока нет рекламодателей. */
  disabled?: boolean
  disabledHint?: string
  children: (state: FormState) => ReactNode
}

/**
 * Кнопка «Создать» и боковая панель с формой. Форма монтируется заново
 * при каждом открытии, поэтому старые ошибки и значения не всплывают.
 */
export function CreateDrawer({
  label,
  title,
  description,
  icon,
  action,
  submitLabel,
  disabled,
  disabledHint,
  children,
}: CreateDrawerProps) {
  const [open, setOpen] = useState(false)
  const [round, setRound] = useState(0)

  const show = () => {
    setRound((r) => r + 1)
    setOpen(true)
  }

  return (
    <>
      <Button
        onClick={show}
        disabled={disabled}
        title={disabled ? disabledHint : undefined}
      >
        <Plus size={17} />
        {label}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        description={description}
        icon={icon}
      >
        <DrawerForm
          key={round}
          action={action}
          submitLabel={submitLabel}
          onDone={() => setOpen(false)}
        >
          {children}
        </DrawerForm>
      </Modal>
    </>
  )
}

function DrawerForm({
  action,
  submitLabel,
  onDone,
  children,
}: {
  action: Action
  submitLabel: string
  onDone: () => void
  children: (state: FormState) => ReactNode
}) {
  const toast = useToast()
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (prev, fd) => {
      try {
        const result = await action(prev, fd)
        if (result.ok) {
          toast.success(result.message ?? 'Сохранено')
          onDone()
        }
        return result
      } catch {
        return { error: 'Не удалось сохранить. Попробуйте ещё раз.' }
      }
    },
    {},
  )

  // Отправляем сами, а не через `action`: React после action сбрасывает
  // форму, и при ошибке выбор в <select> терялся бы. Без сброса всё
  // введённое остаётся на месте, а после успеха панель закрывается.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const fd = new FormData(event.currentTarget)
    startTransition(() => formAction(fd))
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {children(state)}
      {state.error && (
        <p className="border-l-2 border-danger bg-danger/6 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <div className="flex justify-end gap-2 border-t border-line pt-5">
        <Button variant="secondary" onClick={onDone} disabled={pending}>
          Отмена
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Сохраняем…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
