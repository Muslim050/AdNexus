import type { Metadata } from 'next'
import { LayoutDashboard } from 'lucide-react'
import { requireSection } from '@/lib/auth'
import { SectionStub } from '../SectionStub'

export const metadata: Metadata = { title: 'Обзор' }

export default async function Page() {
  await requireSection('/overview')
  return (
    <SectionStub
      title="Обзор"
      subtitle="Сводка по всем рекламодателям, договорам и оплатам."
      icon={LayoutDashboard}
    />
  )
}
