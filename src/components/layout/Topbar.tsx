'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, LogOut, Menu, X } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Avatar } from '@/components/ui/Avatar'
import { useSessionUser } from '@/components/session/SessionProvider'
import { HOME, profileNavFor } from '@/lib/nav'
import { logout } from '@/app/actions/auth'
import { cn } from '@/lib/cn'
import { ROLE_INFO } from '@/lib/roles'
import { DesktopNav } from './Navigation'

/**
 * Тёмная шапка-«вывеска»: логотип, разделы в строку, профиль. Держится
 * сверху при прокрутке — это единственная навигация приложения.
 */
export function Topbar({
  onBurger,
  mobileNavOpen,
  bell,
}: {
  onBurger: () => void
  mobileNavOpen: boolean
  /** Колокольчик — только у тех, кому есть что разбирать. */
  bell?: ReactNode
}) {
  const user = useSessionUser()
  const pathname = usePathname()
  const [menu, setMenu] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const title = user?.name ?? ''
  const subtitle = user ? `${ROLE_INFO[user.role].label} · ${user.login}` : ''

  return (
    <header className="sticky top-0 z-30 border-b border-forest-line bg-forest text-white">
      <div className="mx-auto flex h-16 max-w-[1344px] items-stretch gap-2 px-4 sm:px-6 xl:gap-4">
        <button
          onClick={onBurger}
          aria-label={mobileNavOpen ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={mobileNavOpen}
          className="-ml-1 flex w-10 items-center justify-center text-white/70 transition-colors hover:text-white xl:hidden focus-ring"
        >
          {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link
          href={HOME}
          className="flex shrink-0 items-center pr-2 focus-ring xl:border-r xl:border-forest-line xl:pr-5"
        >
          <Logo size={36} inverted />
        </Link>

        <DesktopNav />

        <div className="ml-auto flex items-center gap-1">
          {bell}

          <div className="relative" ref={ref}>
            <button
              onClick={() => setMenu((v) => !v)}
              aria-expanded={menu}
              className={cn(
                'flex items-center gap-2.5 py-1 pl-1 pr-2 transition-colors hover:bg-white/5 focus-ring',
                menu && 'bg-white/5',
              )}
            >
              <Avatar name={title} color="#0E7745" size="sm" />
              <span className="hidden min-w-0 max-w-[140px] text-left 2xl:block">
                <span className="block truncate text-[12.5px] font-semibold leading-tight">
                  {title}
                </span>
                <span className="block truncate text-[11px] leading-tight text-white/60">
                  {subtitle}
                </span>
              </span>
              <ChevronDown
                size={15}
                className={cn(
                  'text-white/50 transition-transform',
                  menu && 'rotate-180',
                )}
              />
            </button>

            {menu && (
              <div className="absolute right-0 top-[calc(100%+10px)] w-64 border border-line bg-surface text-ink shadow-lift">
                <div className="h-[3px] bg-indigo-500" />
                <div className="px-4 py-3.5">
                  <p className="eyebrow text-ink-muted">Учётная запись</p>
                  <p className="mt-1.5 truncate text-sm font-semibold text-ink">
                    {title}
                  </p>
                  <p className="truncate text-xs text-ink-muted">{subtitle}</p>
                </div>
                {profileNavFor(user?.role).map((it) => {
                  const active = pathname.startsWith(it.href)
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      onClick={() => setMenu(false)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-2 border-t border-line px-4 py-3 text-sm font-semibold transition-colors hover:bg-ink/4 focus-ring',
                        active ? 'text-indigo-600' : 'text-ink',
                      )}
                    >
                      <it.icon size={15} aria-hidden="true" />
                      {it.label}
                    </Link>
                  )
                })}
                <form action={logout}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 border-t border-line px-4 py-3 text-sm font-semibold text-danger transition-colors hover:bg-danger/6"
                  >
                    <LogOut size={15} />
                    Выйти
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
