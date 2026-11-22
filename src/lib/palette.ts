/**
 * Палитра форматов в календаре. Цвета насыщенные, как у меток календаря:
 * слоты разных форматов различаются с одного взгляда.
 */
export const FORMAT_COLORS = [
  { value: '#8E24AA', label: 'Фиолетовый' },
  { value: '#0B8F7A', label: 'Бирюзовый' },
  { value: '#F2B705', label: 'Жёлтый' },
  { value: '#0E7745', label: 'Изумрудный' },
  { value: '#1E6FD9', label: 'Синий' },
  { value: '#D93A3F', label: 'Красный' },
  { value: '#EF6C00', label: 'Оранжевый' },
  { value: '#C2185B', label: 'Малиновый' },
  { value: '#5D4037', label: 'Коричневый' },
  { value: '#546E7A', label: 'Графитовый' },
] as const

export const isPaletteColor = (value: string) =>
  FORMAT_COLORS.some((c) => c.value === value)

/** Цвет текста на заливке: тёмный на светлых (жёлтый), белый на остальных. */
export function textOn(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = n >> 16
  const g = (n >> 8) & 0xff
  const b = n & 0xff
  return r * 0.299 + g * 0.587 + b * 0.114 > 170 ? '#0b1a13' : '#ffffff'
}
