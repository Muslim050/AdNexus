'use client'

import { useState } from 'react'
import { Eye, EyeOff, RefreshCw, UserCog } from 'lucide-react'
import { createAdvertiserUser, updateAdvertiserUser } from '@/app/actions/users'
import { Field, Input } from '@/components/ui/Field'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { SelectField } from '@/components/ui/SelectField'
import { cn } from '@/lib/cn'
import type { FormState } from '@/lib/forms'
import { CreateDrawer, FormDrawer } from './CreateDrawer'

export interface AccountInitial {
  id: string
  login: string
  firstName: string
  lastName: string
  email: string
  phone: string
  isActive: boolean
}

/** «Выдать доступ»: окно нового пользователя; бренд известен — это строка. */
export function NewAdvertiserAccess({
  advertiserId,
  advertiserName,
}: {
  advertiserId: string
  advertiserName: string
}) {
  return (
    <CreateDrawer
      dialog
      label="Выдать доступ"
      size="sm"
      variant="secondary"
      title="Новый пользователь"
      description={`Доступ к платформе · ${advertiserName}`}
      icon={UserCog}
      action={createAdvertiserUser}
      submitLabel="Добавить"
    >
      {(state) => (
        <>
          <input type="hidden" name="advertiserId" value={advertiserId} />
          <AccountFields state={state} />
        </>
      )}
    </CreateDrawer>
  )
}

/** Логин бренда в таблице: клик открывает правку пользователя. */
export function AdvertiserAccount({
  account,
  advertiserName,
  canEdit,
}: {
  account: AccountInitial
  advertiserName: string
  canEdit: boolean
}) {
  const [open, setOpen] = useState(false)
  const [round, setRound] = useState(0)
  const look = cn(
    'border border-line bg-paper px-2 py-0.5 font-mono text-[12px]',
    account.isActive ? 'text-ink' : 'text-ink-muted line-through',
  )
  const title = account.isActive ? undefined : 'Отключён — войти не сможет'

  if (!canEdit) {
    return (
      <span className={look} title={title}>
        {account.login}
      </span>
    )
  }
  return (
    <>
      <button
        type="button"
        title={title ?? 'Изменить пользователя'}
        onClick={() => {
          setRound((r) => r + 1)
          setOpen(true)
        }}
        className={cn(look, 'transition-colors hover:border-ink focus-ring')}
      >
        {account.login}
      </button>
      <FormDrawer
        dialog
        open={open}
        onClose={() => setOpen(false)}
        round={round}
        title="Изменить пользователя"
        description={`Доступ к платформе · ${advertiserName}`}
        icon={UserCog}
        action={updateAdvertiserUser}
        submitLabel="Сохранить"
      >
        {(state) => (
          <>
            <input type="hidden" name="id" value={account.id} />
            <AccountFields state={state} initial={account} />
          </>
        )}
      </FormDrawer>
    </>
  )
}

/** Надёжный пароль без похожих символов (0/O, 1/l) — его диктуют клиенту. */
function generatePassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

function AccountFields({
  state,
  initial,
}: {
  state: FormState
  initial?: AccountInitial
}) {
  const { errors } = state
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [password, setPassword] = useState('')
  const [shown, setShown] = useState(false)

  const iconButton =
    'flex h-9 w-9 items-center justify-center text-ink-muted transition-colors hover:text-ink focus-ring'

  return (
    <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
      <Field label="Имя" error={errors?.firstName}>
        <Input
          name="firstName"
          defaultValue={initial?.firstName}
          placeholder="Тимур"
          autoFocus={!initial}
        />
      </Field>
      <Field label="Фамилия" error={errors?.lastName}>
        <Input
          name="lastName"
          defaultValue={initial?.lastName}
          placeholder="Рахимов"
        />
      </Field>

      <Field label="Email" error={errors?.email}>
        <Input
          name="email"
          type="email"
          autoComplete="off"
          defaultValue={initial?.email}
          placeholder="name@brand.uz"
        />
      </Field>
      <Field label="Телефон" error={errors?.phone}>
        <PhoneInput value={phone} onChange={setPhone} autoComplete="off" />
        <input type="hidden" name="phone" value={phone} />
      </Field>

      <Field label="Логин" required error={errors?.login}>
        <Input
          name="login"
          defaultValue={initial?.login}
          placeholder="ivanov"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={!!errors?.login || undefined}
        />
      </Field>
      <Field
        label="Пароль"
        required={!initial}
        hint={
          initial
            ? 'Пусто — прежний пароль останется.'
            : 'Передайте его рекламодателю: посмотреть потом нельзя.'
        }
        error={errors?.password}
      >
        <div className="relative">
          <Input
            name="password"
            type={shown ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Не короче 8 символов"
            autoComplete="new-password"
            spellCheck={false}
            className="pr-20"
            aria-invalid={!!errors?.password || undefined}
          />
          <span className="absolute right-1 top-1/2 flex -translate-y-1/2">
            <button
              type="button"
              onClick={() => {
                setPassword(generatePassword())
                setShown(true)
              }}
              aria-label="Сгенерировать пароль"
              title="Сгенерировать пароль"
              className={iconButton}
            >
              <RefreshCw size={15} />
            </button>
            <button
              type="button"
              onClick={() => setShown((v) => !v)}
              aria-label={shown ? 'Скрыть пароль' : 'Показать пароль'}
              title={shown ? 'Скрыть пароль' : 'Показать пароль'}
              className={iconButton}
            >
              {shown ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </span>
        </div>
      </Field>

      <Field
        label="Статус"
        hint="Отключённый не сможет войти, но останется в списке."
        error={errors?.status}
      >
        <SelectField
          name="status"
          defaultValue={!initial || initial.isActive ? 'active' : 'off'}
          options={[
            { value: 'active', label: 'Активен' },
            { value: 'off', label: 'Отключён' },
          ]}
        />
      </Field>
    </div>
  )
}
