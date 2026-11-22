import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { SessionProvider } from '@/components/session/SessionProvider'
import { getSessionUser } from '@/lib/session'

export default async function CabinetLayout({ children }: LayoutProps<'/'>) {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  return (
    <SessionProvider user={user}>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  )
}
