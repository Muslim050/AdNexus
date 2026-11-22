import {
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from './roles'

export { HOME } from './routes'

export interface NavItem {
  href: string
  label: string
  /** Пояснение раздела — подзаголовок страницы. */
  description: string
  icon: LucideIcon
  roles: Role[]
}

export const NAV: NavItem[] = [
  {
    href: '/calendar',
    label: 'Календарь размещений',
    description: 'Бронирование временных слотов',
    icon: CalendarDays,
    roles: ['admin', 'viewer', 'advertiser'],
  },
  {
    href: '/orders',
    label: 'Заказы и медиапланы',
    description: 'Размещения брендов: оплаты и статусы',
    icon: ClipboardList,
    roles: ['admin', 'viewer', 'advertiser'],
  },
  {
    href: '/advertisers',
    label: 'Рекламодатели и бренды',
    description: 'Бренды, их договоры и реквизиты',
    icon: Building2,
    roles: ['admin', 'viewer'],
  },
  {
    href: '/directory',
    label: 'Справочник',
    description: 'Форматы размещений и их цвета в календаре',
    icon: BookOpen,
    roles: ['admin', 'viewer'],
  },
]

export const navFor = (role: Role | undefined) =>
  role ? NAV.filter((item) => item.roles.includes(role)) : []

/** Номер раздела на «указателе»: 01, 02… */
export const sectionNo = (index: number) => String(index + 1).padStart(2, '0')
