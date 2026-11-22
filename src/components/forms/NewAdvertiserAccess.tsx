'use client'

import { useState } from 'react'
import { KeyRound, RefreshCw } from 'lucide-react'
import { createAdvertiserUser } from '@/app/actions/users'
import { Field, Input } from '@/components/ui/Field'
import { CreateDrawer } from './CreateDrawer'

/** Надёжный пароль без похожих символов (0/O, 1/l) — его диктуют клиенту. */
function generatePassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

export function NewAdvertiserAccess({
  advertiserId,
  advertiserName,
  contact,
}: {
  advertiserId: string
  advertiserName: string
  contact: string
}) {
  return (
    <CreateDrawer
      label="Выдать доступ"
      size="sm"
      variant="secondary"
      title="Доступ в кабинет"
      description={`${advertiserName}: рекламодатель сможет входить и бронировать слоты по своим договорам.`}
      icon={KeyRound}
      action={createAdvertiserUser}
      submitLabel="Создать доступ"
    >
      {({ errors }) => (
        <AccessFields
          advertiserId={advertiserId}
          contact={contact}
          errors={errors}
        />
      )}
    </CreateDrawer>
  )
}

function AccessFields({
  advertiserId,
  contact,
  errors,
}: {
  advertiserId: string
  contact: string
  errors?: Record<string, string>
}) {
  const [password, setPassword] = useState('')

  return (
    <>
      <input type="hidden" name="advertiserId" value={advertiserId} />
      <Field
        label="Имя"
        required
        hint="Показывается в шапке кабинета."
        error={errors?.name}
      >
        <Input name="name" defaultValue={contact} autoFocus />
      </Field>
      <Field
        label="Логин"
        required
        hint="Латиница, цифры, точка, дефис или _. Вход не зависит от регистра."
        error={errors?.login}
      >
        <Input
          name="login"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={!!errors?.login || undefined}
        />
      </Field>
      <Field
        label="Пароль"
        required
        hint="От 8 символов. Передайте его рекламодателю — посмотреть пароль потом будет нельзя."
        error={errors?.password}
      >
        <div className="flex gap-2">
          <Input
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            spellCheck={false}
            className="font-mono"
            aria-invalid={!!errors?.password || undefined}
          />
          <button
            type="button"
            onClick={() => setPassword(generatePassword())}
            className="flex h-11 shrink-0 items-center gap-1.5 border border-ink/20 px-3 text-[13px] font-semibold text-ink-soft transition-colors hover:border-ink hover:text-ink focus-ring"
          >
            <RefreshCw size={14} />
            Сгенерировать
          </button>
        </div>
      </Field>
    </>
  )
}
