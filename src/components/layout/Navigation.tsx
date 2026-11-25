'use client'

import Link, { useLinkStatus } from 'next/link'
import { usePathname } from 'next/navigation'
import { navFor, sectionNo } from '@/lib/nav'
import { useSessionUser } from '@/components/session/SessionProvider'
import { cn } from '@/lib/cn'

/** Разделы, доступные роли текущего пользователя, в порядке меню. */
export function useNavItems() {
  return navFor(useSessionUser()?.role)
}

const isActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`)

/**
 * Разделы в строку, на тёмной шапке. Выбранный — светлый текст
 * с мятной планкой по нижнему краю шапки.
 */
export function DesktopNav() {
  const items = useNavItems()
  const pathname = usePathname()

  return (
    <nav className="hidden h-full items-stretch xl:flex">
      {items.map((it, index) => {
        const active = isActive(pathname, it.href)
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group relative flex items-center gap-2 px-3 text-[13px] font-semibold transition-colors focus-ring',
              active ? 'text-white' : 'text-white/70 hover:text-white',
            )}
          >
            <span
              className={cn(
                'font-mono text-[10px] font-semibold tracking-wider transition-colors',
                active
                  ? 'text-lime-300'
                  : 'text-white/50 group-hover:text-white/70',
              )}
            >
              {sectionNo(index)}
            </span>
            <span className="whitespace-nowrap">{it.label}</span>
            <NavBar active={active} />
          </Link>
        )
      })}
    </nav>
  )
}

/** Планка под пунктом: мигает, пока раздел открывается, — клик виден сразу. */
function NavBar({ active }: { active: boolean }) {
  const { pending } = useLinkStatus()
  return (
    <span
      className={cn(
        'absolute inset-x-3 bottom-0 h-[3px] transition-colors',
        active
          ? 'bg-lime-300'
          : pending
            ? 'bg-lime-300/70 motion-safe:animate-pulse'
            : 'bg-transparent group-hover:bg-white/15',
      )}
    />
  )
}

/** Мобильное меню: крупные строки-указатели на тёмном фоне. */
export function MobileNav({ onNavigate }: { onNavigate: () => void }) {
  const items = useNavItems()
  const pathname = usePathname()

  return (
    <nav className="border-b border-forest-line bg-forest px-5 pb-6 pt-2 shadow-lift">
      {items.map((it, index) => {
        const active = isActive(pathname, it.href)
        const Icon = it.icon
        return (
          <Link
            key={it.href}
            href={it.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group flex items-center gap-4 border-b border-forest-line py-4 transition-colors focus-ring',
              active ? 'text-white' : 'text-white/70 hover:text-white',
            )}
          >
            <span
              className={cn(
                'font-mono text-[11px] font-semibold',
                active ? 'text-lime-300' : 'text-white/50',
              )}
            >
              {sectionNo(index)}
            </span>
            <Icon size={18} strokeWidth={1.75} className="shrink-0" />
            <span className="flex-1 font-display text-base font-semibold">
              {it.label}
            </span>
            {active && <span className="h-2 w-2 bg-lime-300" />}
          </Link>
        )
      })}
    </nav>
  )
}
