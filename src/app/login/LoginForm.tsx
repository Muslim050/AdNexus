'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { HOME } from '@/lib/nav'

/**
 * Форма входа. ВРЕМЕННО ведёт сразу в кабинет: проверка логина и пароля
 * появится вместе с Better Auth на этапе 3.
 */
export function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordShown, setPasswordShown] = useState(false)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    router.push(HOME)
  }

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

      <form onSubmit={submit} className="mt-9 space-y-5">
        <Field label="Логин">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            autoComplete="username"
            autoFocus
          />
        </Field>

        <Field label="Пароль">
          <div className="relative">
            <Input
              type={passwordShown ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              autoComplete="current-password"
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
        >
          Войти в платформу
          <ArrowRight size={18} />
        </Button>
      </form>
    </motion.div>
  )
}
