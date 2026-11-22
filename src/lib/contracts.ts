import type { BadgeTone } from '@/components/ui/Badge'
import type { ContractStatus } from '@/db/schema'

export const CONTRACT_STATUS: Record<
  ContractStatus,
  { label: string; tone: BadgeTone }
> = {
  active: { label: 'Действует', tone: 'success' },
  completed: { label: 'Завершён', tone: 'muted' },
  terminated: { label: 'Расторгнут', tone: 'danger' },
}
