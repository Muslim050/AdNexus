'use client'

import {
  startTransition,
  useActionState,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { Plus, type LucideIcon } from 'lucide-react'
import {
  Button,
  type ButtonSize,
  type ButtonVariant,
} from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import type { FormState } from '@/lib/forms'

type Action = (prev: FormState, fd: FormData) => Promise<FormState>

interface FormDrawerProps {
  open: boolean
  onClose: () => void
  /** Меняется при каждом открытии — форма монтируется заново, без старых ошибок. */
  round: number
  title: string
  description?: string
  icon: LucideIcon
  action: Action
  submitLabel: string
  /** Окно по центру вместо боковой панели — для коротких форм. */
  dialog?: boolean
  children: (state: FormState) => ReactNode
}

/** Панель с формой, открытием управляет родитель. */
export function FormDrawer({
  open,
  onClose,
  round,
  title,
  description,
  icon,
  action,
  submitLabel,
  dialog,
  children,
}: FormDrawerProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      icon={icon}
      size={dialog ? 'sm' : 'md'}
      wide={dialog}
    >
      <DrawerForm
        key={round}
        action={action}
        submitLabel={submitLabel}
        onDone={onClose}
      >
        {children}
      </DrawerForm>
    </Modal>
  )
}

type CreateDrawerProps = Omit<FormDrawerProps, 'open' | 'onClose' | 'round'> & {
  /** Надпись на кнопке, открывающей панель. */
  label: string
  /** Кнопку можно заблокировать — например, пока нет рекламодателей. */
  disabled?: boolean
  disabledHint?: string
  size?: ButtonSize
  variant?: ButtonVariant
}

/** Кнопка «Создать» и боковая панель с формой. */
export function CreateDrawer({
  label,
  disabled,
  disabledHint,
  size,
  variant,
  ...drawer
}: CreateDrawerProps) {
  const [open, setOpen] = useState(false)
  const [round, setRound] = useState(0)

  return (
    <>
      <Button
        onClick={() => {
          setRound((r) => r + 1)
          setOpen(true)
        }}
        disabled={disabled}
        title={disabled ? disabledHint : undefined}
        size={size}
        variant={variant}
      >
        <Plus size={size === 'sm' ? 15 : 17} />
        {label}
      </Button>
      <FormDrawer
        {...drawer}
        open={open}
        onClose={() => setOpen(false)}
        round={round}
      />
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
  const [waitUpload, setWaitUpload] = useState(false)
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
    // Файл ещё грузится — его описания в форме пока нет.
    if (event.currentTarget.querySelector('[data-uploading]')) {
      setWaitUpload(true)
      return
    }
    setWaitUpload(false)
    const fd = new FormData(event.currentTarget)
    startTransition(() => formAction(fd))
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {children(state)}
      {waitUpload && (
        <p className="border-l-2 border-warning bg-warning/8 px-3 py-2 text-sm text-warning">
          Дождитесь окончания загрузки файла.
        </p>
      )}
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
