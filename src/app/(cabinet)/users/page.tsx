import type { Metadata } from 'next'
import { Users } from 'lucide-react'
import { requireSection } from '@/lib/auth'
import { SectionStub } from '../SectionStub'

export const metadata: Metadata = { title: 'Пользователи' }

export default async function Page() {
  await requireSection('/users')
  return (
    <SectionStub
      title="Пользователи"
      subtitle="Учётные записи и роли доступа."
      icon={Users}
    />
  )
}
