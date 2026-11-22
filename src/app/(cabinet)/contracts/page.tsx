import type { Metadata } from 'next'
import { FileText } from 'lucide-react'
import { requireSection } from '@/lib/auth'
import { SectionStub } from '../SectionStub'

export const metadata: Metadata = { title: 'Договоры' }

export default async function Page() {
  await requireSection('/contracts')
  return (
    <SectionStub
      title="Договоры"
      subtitle="Условия, суммы, поступления и статусы оплаты по месяцам."
      icon={FileText}
    />
  )
}
