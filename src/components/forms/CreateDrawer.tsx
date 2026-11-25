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
import { FormError } from '@/components/ui/FormError'
import { Modal, useModalClose } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useDraftRef, useFocusFirstError } from '@/lib/draft'
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
  const requestClose = useModalClose()
  const formRef = useDraftRef()
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
  useFocusFirstError(formRef, state)

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
    <form ref={formRef} onSubmit={submit} noValidate className="space-y-5">
      {children(state)}
      {/* Низ формы прилипает к краю панели: «Сохранить» видно всегда. */}
      <div className="sticky bottom-0 z-20 -mx-4 -mb-5 space-y-3 border-t border-line bg-surface px-4 py-4 sm:-mx-6 sm:px-6">
        {waitUpload && (
          <FormError tone="warning">
            Дождитесь окончания загрузки файла.
          </FormError>
        )}
        {state.error && <FormError>{state.error}</FormError>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={requestClose} disabled={pending}>
            Отмена
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Сохраняем…' : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}
