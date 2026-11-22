import {
  Building2,
  FileText,
  LayoutDashboard,
  LineChart,
  Megaphone,
  Store,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from './roles'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  roles: Role[]
}

export { HOME } from './routes'

export const NAV: NavItem[] = [
  {
    href: '/campaigns',
    label: 'Кампании',
    icon: Megaphone,
    roles: ['admin', 'viewer', 'advertiser'],
  },
  {
    href: '/overview',
    label: 'Обзор',
    icon: LayoutDashboard,
    roles: ['admin', 'viewer'],
  },
  {
    href: '/contracts',
    label: 'Договоры',
    icon: FileText,
    roles: ['admin', 'viewer'],
  },
  {
    href: '/placements',
    label: 'Площадки',
    icon: Store,
    roles: ['admin', 'viewer'],
  },
  {
    href: '/advertisers',
    label: 'Рекламодатели',
    icon: Building2,
    roles: ['admin', 'viewer'],
  },
  {
    href: '/users',
    label: 'Пользователи',
    icon: Users,
    roles: ['admin'],
  },
  {
    href: '/reports',
    label: 'Отчёт',
    icon: LineChart,
    roles: ['advertiser'],
  },
]

export const navFor = (role: Role | undefined) =>
  role ? NAV.filter((item) => item.roles.includes(role)) : []

/** Номер раздела на «указателе»: 01, 02… */
export const sectionNo = (index: number) => String(index + 1).padStart(2, '0')
