/**
 * Сумма размещения по умолчанию: стоимость пакета формата
 * (показы × цена показа) минус скидка по договору.
 */
export function suggestedAmount(
  format:
    { impressions: number; pricePerImpression: string | number } | undefined,
  discount: string | number | null | undefined,
): number {
  if (!format) return 0
  const pack = format.impressions * Number(format.pricePerImpression)
  const off = Math.min(Math.max(Number(discount ?? 0), 0), 100)
  return Math.round(pack * (1 - off / 100) * 100) / 100
}
