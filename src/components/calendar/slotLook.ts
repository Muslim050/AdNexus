import type { CSSProperties } from 'react'
import type { BookingStatus } from '@/lib/bookings'
import { textOn } from '@/lib/palette'

/**
 * Вид слота по статусу — цвет формата остаётся, меняется «плотность»:
 * - Отправлен — пунктир, едва тонированный фон: заявка ещё не принята;
 * - Получен / Рассматривается — светлая заливка с планкой слева;
 * - Активен — сплошная заливка;
 * - Выполнен — заливка приглушена.
 * Чужой слот у рекламодателя — серая штриховка «Занято».
 */
export function slotLook(
  color: string,
  status: BookingStatus,
  masked: boolean,
): { className: string; style: CSSProperties } {
  if (masked) {
    return {
      className: 'bg-hatch border border-dashed border-ink/20 text-ink-muted',
      style: { backgroundColor: 'rgba(11, 26, 19, 0.04)' },
    }
  }
  switch (status) {
    case 'sent':
      return {
        className: 'border border-dashed text-ink',
        style: { borderColor: color, backgroundColor: `${color}14` },
      }
    case 'received':
    case 'reviewing':
      return {
        className: 'text-ink',
        style: {
          backgroundColor: `${color}2e`,
          boxShadow: `inset 3px 0 0 ${color}`,
        },
      }
    case 'completed':
      return {
        className: 'opacity-60',
        style: { backgroundColor: color, color: textOn(color) },
      }
    default:
      return {
        className: '',
        style: { backgroundColor: color, color: textOn(color) },
      }
  }
}
