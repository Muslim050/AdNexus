import type { Metadata } from 'next'
import { Users } from 'lucide-react'
import { SectionStub } from '../SectionStub'

export const metadata: Metadata = { title: 'Пользователи' }

export default function Page() {
  return (
    <SectionStub
      title="Пользователи"
      subtitle="Учётные записи и роли доступа."
      icon={Users}
    />
  )
}
