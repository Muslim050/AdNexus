import type { Metadata } from 'next'
import { Megaphone } from 'lucide-react'
import { SectionStub } from '../SectionStub'

export const metadata: Metadata = { title: 'Кампании' }

export default function Page() {
  return (
    <SectionStub
      title="Кампании"
      subtitle="Рекламные кампании брендов: статусы, суммы, медиаплан и отчёты."
      icon={Megaphone}
    />
  )
}
