import { Suspense } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Bell } from '@/components/layout/Bell'
import { SessionProvider } from '@/components/session/SessionProvider'
import { Loader } from '@/components/ui/Loader'
import { requireUser } from '@/lib/auth'
import { attentionItems } from '@/lib/data/attention'
import { isEditor } from '@/lib/roles'

/**
 * Кабинет. Сессия читается из запроса, поэтому каркас с пользователем
 * стримится за <Suspense>: со включёнными Cache Components чтение cookie
 * вне границы — ошибка сборки.
 */
export default function CabinetLayout({ children }: LayoutProps<'/'>) {
  return (
    <Suspense fallback={<Loader full />}>
      <SignedIn>{children}</SignedIn>
    </Suspense>
  )
}

async function SignedIn({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  return (
    <SessionProvider user={user}>
      <AppShell
        bell={
          isEditor(user.role) && (
            // Счётчики не держат шапку: она приходит сразу, они — следом.
            <Suspense fallback={<span className="w-10" />}>
              <AttentionBell />
            </Suspense>
          )
        }
      >
        {children}
      </AppShell>
    </SessionProvider>
  )
}

async function AttentionBell() {
  return <Bell items={await attentionItems()} />
}
