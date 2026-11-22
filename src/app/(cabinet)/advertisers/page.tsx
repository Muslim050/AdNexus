import type { Metadata } from 'next'
import { Building2 } from 'lucide-react'
import { SectionStub } from '../SectionStub'

export const metadata: Metadata = { title: 'Рекламодатели' }

export default function Page() {
  return (
    <SectionStub
      title="Рекламодатели"
      subtitle="Бренды, их реквизиты и договоры."
      icon={Building2}
    />
  )
}
