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

const INK = '#0b1a13'

/** Относительная яркость цвета по WCAG. */
function luminance(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16)
  const [r, g, b] = [n >> 16, (n >> 8) & 0xff, n & 0xff].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Цвет текста на заливке: белый или тёмный — какой контрастнее. */
export function textOn(hex: string): string {
  const fill = luminance(hex) + 0.05
  const white = 1.05 / fill
  const ink = fill / (luminance(INK) + 0.05)
  return white >= ink ? '#ffffff' : INK
}
