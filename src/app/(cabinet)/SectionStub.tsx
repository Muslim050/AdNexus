import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'

/** Заглушка раздела, пока его логика не спроектирована. */
export function SectionStub({
  title,
  subtitle,
  icon,
}: {
  title: string
  subtitle: string
  icon: LucideIcon
}) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <EmptyState
        icon={icon}
        title="Раздел в работе"
        description="Раздел появится, когда спроектируем его логику."
      />
    </>
  )
}
