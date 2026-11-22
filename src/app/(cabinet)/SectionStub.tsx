import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'

/** Заглушка раздела, пока экран не перенесён из Global Expo. */
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
        description="Экран переносится вместе с базой данных — следующий этап плана."
      />
    </>
  )
}
