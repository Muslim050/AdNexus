import type { BadgeTone } from '@/components/ui/Badge'

/** Статус бренда: отключённый не бронирует и не входит в кабинет. */
export const ADVERTISER_STATUSES = ['active', 'paused'] as const
export type AdvertiserStatus = (typeof ADVERTISER_STATUSES)[number]

export const ADVERTISER_STATUS: Record<
  AdvertiserStatus,
  { label: string; tone: BadgeTone }
> = {
  active: { label: 'Активен', tone: 'success' },
  paused: { label: 'Отключён', tone: 'muted' },
}

export const isAdvertiserStatus = (v: unknown): v is AdvertiserStatus =>
  ADVERTISER_STATUSES.includes(v as AdvertiserStatus)

/** Цвета бренда: подложка инициалов, пока нет логотипа. */
export const BRAND_COLORS = [
  { value: '#0E7745', label: 'Изумрудный' },
  { value: '#F2B705', label: 'Жёлтый' },
  { value: '#0EA5E9', label: 'Голубой' },
  { value: '#16A34A', label: 'Зелёный' },
  { value: '#EF4444', label: 'Красный' },
  { value: '#8B5CF6', label: 'Фиолетовый' },
  { value: '#F59E0B', label: 'Оранжевый' },
  { value: '#EC4899', label: 'Розовый' },
] as const

export const isBrandColor = (v: string) =>
  BRAND_COLORS.some((c) => c.value === v)
