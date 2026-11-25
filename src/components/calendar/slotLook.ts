import type { CSSProperties } from 'react'
import { textOn } from '@/lib/palette'

/**
 * Вид слота: всегда сплошной цвет формата из справочника — статус
 * показывает плашка (StatusPill) справа, а не бледность заливки.
 * Вышедший — тот же цвет, но бледный.
 * Чужой слот у рекламодателя — серая штриховка «Занято».
 */
export function slotLook(
  color: string,
  masked: boolean,
  passed = false,
): { className: string; style: CSSProperties } {
  if (masked) {
    return {
      className: 'bg-hatch border border-dashed border-ink/20 text-ink-muted',
      style: { backgroundColor: 'rgba(11, 26, 19, 0.04)' },
    }
  }
  // Вышедший — бледный тон формата с тёмным текстом: прозрачность гасила бы
  // и подпись, а она должна читаться.
  if (passed) {
    return {
      className: 'text-ink',
      style: { backgroundColor: `color-mix(in srgb, ${color} 30%, white)` },
    }
  }
  return {
    className: '',
    style: { backgroundColor: color, color: textOn(color) },
  }
}
