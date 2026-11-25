import type { ReactNode } from 'react'
import { Logo } from '@/components/Logo'
import { cn } from '@/lib/cn'

/**
 * Страница вместо раздела: что случилось и куда идти дальше. `full` —
 * отдельной страницей со знаком сверху, без него — внутри кабинета.
 */
export function ErrorScreen({
  code,
  title,
  text,
  actions,
  full = false,
}: {
  code: string
  title: string
  text: ReactNode
  actions: ReactNode
  full?: boolean
}) {
  return (
    <main
      className={cn(
        'flex flex-col items-center justify-center px-6 text-center',
        full ? 'min-h-dvh bg-paper py-16' : 'min-h-[60dvh] py-12',
      )}
    >
      {full && <Logo size={44} className="mb-10" />}
      <p className="font-mono text-sm font-semibold tracking-wider text-indigo-600 tnum">
        {code}
      </p>
      <h1 className="mt-3 font-display text-display-md font-bold text-ink sm:text-display-lg">
        {title}
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
        {text}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">{actions}</div>
    </main>
  )
}

/** Ссылка в облике кнопки: основная и обычная. */
export const linkButton = (primary = false) =>
  cn(
    'inline-flex h-11 items-center justify-center gap-2 px-5 text-[13.5px] font-bold transition-colors focus-ring',
    primary
      ? 'bg-indigo-500 text-white shadow-inset hover:bg-indigo-600'
      : 'border border-ink/20 bg-surface text-ink hover:border-ink',
  )
