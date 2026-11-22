import type { Metadata } from 'next'
import { LayoutDashboard } from 'lucide-react'
import { requireSection } from '@/lib/auth'
import { SectionStub } from '../SectionStub'

export const metadata: Metadata = { title: 'Дашборд' }

export default async function Page() {
  await requireSection('/dashboard')
  return (
    <SectionStub
      title="Дашборд"
      subtitle="Общая статистика и показатели."
      icon={LayoutDashboard}
    />
  )
}
