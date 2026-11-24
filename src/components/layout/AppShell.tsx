'use client'

import { useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { Topbar } from './Topbar'
import { MobileNav } from './Navigation'

/**
 * Каркас кабинета: сверху тёмная «вывеска» с разделами, под ней — лист
 * страницы. Бокового меню нет: разделов немного, и они помещаются в строку.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [mobileNav, setMobileNav] = useState(false)
  const pathname = usePathname()
  // Календарю с панелями нужна вся ширина, иначе дни недели узкие. На широком
  // экране он занимает ровно окно: прокручивается сетка, а не страница.
  const wide = pathname === '/calendar'

  return (
    <div
      className={cn(
        'flex min-h-screen flex-col bg-paper',
        // В низком окне сетке нужна высота — тогда страница прокручивается.
        wide && 'wide:h-dvh wide:min-h-[640px]',
      )}
    >
      <Topbar
        mobileNavOpen={mobileNav}
        onBurger={() => setMobileNav((open) => !open)}
      />

      <AnimatePresence>
        {mobileNav && (
          <motion.div
            className="fixed inset-x-0 bottom-0 top-16 z-40 xl:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-forest/50"
              onClick={() => setMobileNav(false)}
            />
            <motion.div
              className="absolute inset-x-0 top-0"
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.2, 0.9, 0.3, 1] }}
            >
              <MobileNav onNavigate={() => setMobileNav(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main
        className={cn(
          'flex-1 px-5 pb-12 pt-7 sm:pt-9',
          wide
            ? 'wide:flex wide:min-h-0 wide:flex-col wide:pb-5 wide:pt-6'
            : 'sm:px-8',
        )}
      >
        {/* Без проявления: раздел должен отвечать на клик сразу. */}
        <div
          key={pathname}
          className={cn(
            'mx-auto',
            wide
              ? 'max-w-[1760px] wide:flex wide:min-h-0 wide:w-full wide:flex-1 wide:flex-col'
              : 'max-w-[1280px]',
          )}
        >
          {children}
        </div>
      </main>

      <footer
        className={cn(
          'border-t border-line px-5 py-4 sm:px-8',
          wide && 'wide:hidden',
        )}
      >
        <div className="eyebrow mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-2 text-ink-muted">
          <span>AdNexus · CRM Platform</span>
          <span>Календарь · заказы · справочник</span>
        </div>
      </footer>
    </div>
  )
}
