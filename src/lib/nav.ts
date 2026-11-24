import {
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardList,
  GitCompareArrows,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { OWNERS, ROLES, STAFF, type Role } from './roles'

export { HOME } from './routes'

export interface NavItem {
  href: string
  label: string
  /** Пояснение раздела — подзаголовок страницы. */
  description: string
  icon: LucideIcon
  roles: readonly Role[]
  /** Пункт меню профиля, а не строки разделов. */
  inProfile?: boolean
}

export const NAV: NavItem[] = [
  {
    href: '/calendar',
    label: 'Календарь публикаций',
    description: 'Бронирование временных слотов',
    icon: CalendarDays,
    roles: ROLES,
  },
  {
    href: '/orders',
    label: 'Заказы и медиапланы',
    description: 'Публикации брендов: оплаты и статусы',
    icon: ClipboardList,
    roles: ROLES,
  },
  {
    href: '/facts',
    label: 'Стыковка публикаций',
    description: 'План публикаций и что вышло на самом деле',
    icon: GitCompareArrows,
    roles: STAFF,
  },
  {
    href: '/advertisers',
    label: 'Рекламодатели и бренды',
    description: 'Бренды, их договоры и реквизиты',
    icon: Building2,
    roles: STAFF,
  },
  {
    href: '/directory',
    label: 'Справочник',
    description: 'Форматы публикаций и их цвета в календаре',
    icon: BookOpen,
    roles: STAFF,
  },
  {
    href: '/staff',
    label: 'Сотрудники и роли',
    description: 'Кто работает на площадке и что ему можно',
    icon: Users,
    roles: OWNERS,
    inProfile: true,
  },
]

const allowed = (role: Role | undefined, inProfile: boolean) =>
  NAV.filter(
    (item) =>
      !!role && item.roles.includes(role) && !!item.inProfile === inProfile,
  )

/** Разделы в шапке. */
export const navFor = (role: Role | undefined) => allowed(role, false)
/** Пункты меню профиля — под именем пользователя. */
export const profileNavFor = (role: Role | undefined) => allowed(role, true)

/** Номер раздела на «указателе»: 01, 02… */
export const sectionNo = (index: number) => String(index + 1).padStart(2, '0')
