'use client'

import { useActionState, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { login, type LoginState } from '@/app/actions/auth'

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    {},
  )
  // Пароль набирают вслепую и ошибаются — глазик показывает набранное.
  const [passwordShown, setPasswordShown] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: [0.2, 0.9, 0.3, 1] }}
      className="w-full max-w-[400px]"
    >
      <p className="eyebrow flex items-center gap-2 text-indigo-600">
        <span>01</span>
        <span className="h-px w-6 bg-indigo-500/50" />
        <span className="text-ink-muted">Вход в кабинет</span>
      </p>
      <h1 className="mt-4 font-display text-[32px] font-extrabold leading-[1.08] tracking-[-0.03em] text-ink">
        Добро пожаловать
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        Войдите под учётной записью, которую выдал менеджер AdNexus.
      </p>

      <form action={formAction} className="mt-9 space-y-5" noValidate>
        <Field label="Логин">
          <Input
            name="login"
            defaultValue={state.login}
            key={state.login}
            placeholder="admin"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
            required
          />
        </Field>

        <Field label="Пароль" error={state.error}>
          <div className="relative">
            <Input
              name="password"
              type={passwordShown ? 'text' : 'password'}
              placeholder="••••••"
              autoComplete="current-password"
              required
              // Место под кнопку: иначе длинный пароль уезжает под неё.
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setPasswordShown((shown) => !shown)}
              aria-label={passwordShown ? 'Скрыть пароль' : 'Показать пароль'}
              title={passwordShown ? 'Скрыть пароль' : 'Показать пароль'}
              className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-ink-muted transition-colors hover:text-ink focus-ring"
            >
              {passwordShown ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>

        <Button
          size="lg"
          variant="primary"
          type="submit"
          className="w-full justify-between"
          disabled={pending}
        >
          {pending ? 'Входим…' : 'Войти в платформу'}
          <ArrowRight size={18} />
        </Button>
      </form>
    </motion.div>
  )
}
