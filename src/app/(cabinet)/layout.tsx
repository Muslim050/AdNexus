import { Suspense } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { SessionProvider } from '@/components/session/SessionProvider'
import { Loader } from '@/components/ui/Loader'
import { requireUser } from '@/lib/auth'

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
      <AppShell>{children}</AppShell>
    </SessionProvider>
  )
}
