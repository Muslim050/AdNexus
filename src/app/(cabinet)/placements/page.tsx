import type { Metadata } from 'next'
import { Store } from 'lucide-react'
import { SectionStub } from '../SectionStub'

export const metadata: Metadata = { title: 'Площадки' }

export default function Page() {
  return (
    <SectionStub
      title="Площадки"
      subtitle="Каналы и места размещения рекламы."
      icon={Store}
    />
  )
}
