import type { Metadata } from 'next'
import { FileText } from 'lucide-react'
import { SectionStub } from '../SectionStub'

export const metadata: Metadata = { title: 'Договоры' }

export default function Page() {
  return (
    <SectionStub
      title="Договоры"
      subtitle="Условия, суммы, поступления и статусы оплаты по месяцам."
      icon={FileText}
    />
  )
}
