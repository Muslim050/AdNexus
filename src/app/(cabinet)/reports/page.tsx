import type { Metadata } from 'next'
import { LineChart } from 'lucide-react'
import { requireSection } from '@/lib/auth'
import { SectionStub } from '../SectionStub'

export const metadata: Metadata = { title: 'Отчёт' }

export default async function Page() {
  await requireSection('/reports')
  return (
    <SectionStub
      title="Отчёт"
      subtitle="Результаты кампаний вашего бренда."
      icon={LineChart}
    />
  )
}
