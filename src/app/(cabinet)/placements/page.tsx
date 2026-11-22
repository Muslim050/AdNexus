import type { Metadata } from 'next'
import { Store } from 'lucide-react'
import { requireSection } from '@/lib/auth'
import { SectionStub } from '../SectionStub'

export const metadata: Metadata = { title: 'Площадки' }

export default async function Page() {
  await requireSection('/placements')
  return (
    <SectionStub
      title="Площадки"
      subtitle="Каналы и места размещения рекламы."
      icon={Store}
    />
  )
}
