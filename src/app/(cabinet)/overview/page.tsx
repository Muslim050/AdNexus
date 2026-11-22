import type { Metadata } from 'next'
import { LayoutDashboard } from 'lucide-react'
import { SectionStub } from '../SectionStub'

export const metadata: Metadata = { title: 'Обзор' }

export default function Page() {
  return (
    <SectionStub
      title="Обзор"
      subtitle="Сводка по всем рекламодателям, договорам и оплатам."
      icon={LayoutDashboard}
    />
  )
}
