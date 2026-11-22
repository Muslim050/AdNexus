import type { Metadata } from 'next'
import { Megaphone } from 'lucide-react'
import { requireSection } from '@/lib/auth'
import { SectionStub } from '../SectionStub'

export const metadata: Metadata = { title: 'Кампании' }

export default async function Page() {
  await requireSection('/campaigns')
  return (
    <SectionStub
      title="Кампании"
      subtitle="Рекламные кампании брендов: статусы, суммы, медиаплан и отчёты."
      icon={Megaphone}
    />
  )
}
