import type { Metadata } from 'next'
import { LineChart } from 'lucide-react'
import { SectionStub } from '../SectionStub'

export const metadata: Metadata = { title: 'Отчёт' }

export default function Page() {
  return (
    <SectionStub
      title="Отчёт"
      subtitle="Результаты кампаний вашего бренда."
      icon={LineChart}
    />
  )
}
