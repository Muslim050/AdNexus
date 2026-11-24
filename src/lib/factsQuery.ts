import { isVerdict } from './facts'
import { todayTashkent } from './week'

const UUID = /^[0-9a-f-]{36}$/
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/

/** Фильтры стыковки из адреса — одни и те же у страницы и отчёта. */
export function parseFactsQuery(get: (key: string) => string) {
  const currentMonth = todayTashkent().slice(0, 7)
  const month = get('month')
  const verdict = get('verdict')
  const brand = get('brand')
  const contract = get('contract')
  return {
    currentMonth,
    period: month === 'all' || MONTH.test(month) ? month : currentMonth,
    verdict: isVerdict(verdict) ? verdict : undefined,
    advertiserId: UUID.test(brand) ? brand : '',
    contractId: UUID.test(contract) ? contract : '',
    page: Math.max(1, Math.trunc(Number(get('page'))) || 1),
  }
}
