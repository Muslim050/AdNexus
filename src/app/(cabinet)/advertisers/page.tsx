import type { Metadata } from 'next'
import { Building2 } from 'lucide-react'
import { requireSection } from '@/lib/auth'
import { SectionStub } from '../SectionStub'

export const metadata: Metadata = { title: 'Рекламодатели' }

export default async function Page() {
  await requireSection('/advertisers')
  return (
    <SectionStub
      title="Рекламодатели"
      subtitle="Бренды, их реквизиты и договоры."
      icon={Building2}
    />
  )
}
