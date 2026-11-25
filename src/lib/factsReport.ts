import 'server-only'
import type { Blob } from 'node:buffer'
import type { Stream } from 'node:stream'
import writeExcelFile, { type Feature } from 'write-excel-file/node'
import { sanitizeAttributeValue } from 'write-excel-file/utility'
import type { CheckedBooking, FactsTotals } from '@/lib/data/facts'
import { VERDICT, plannedAt, shiftMinutes, type Verdict } from '@/lib/facts'

/** Ячейка отчёта: значение и оформление, как их ждёт write-excel-file. */
interface Cell {
  value?: string | number | Date
  type?: StringConstructor | NumberConstructor | DateConstructor
  format?: string
  fontWeight?: 'bold'
  fontSize?: number
  textColor?: string
  backgroundColor?: string
  align?: 'left' | 'center' | 'right'
  alignVertical?: 'top' | 'center'
  wrap?: boolean
  columnSpan?: number
  borderStyle?: 'thin'
  borderColor?: string
}

const INK = '#0B1A13'
const MUTED = '#5A665F'
const LINE = '#D5DAD7'
const VERDICT_COLOR: Record<Verdict, string> = {
  waiting: '#1E6FD9',
  mismatch: '#B26A00',
  matched: '#0E7745',
  missed: '#C62828',
}

const COLUMNS = [
  { header: '№', width: 5 },
  { header: 'Рекламодатель', width: 20 },
  { header: 'Кампания', width: 26 },
  { header: 'Договор', width: 14 },
  { header: 'Формат', width: 22 },
  { header: 'План', width: 17 },
  { header: 'Факт', width: 17 },
  { header: 'Отклонение, мин', width: 13 },
  { header: 'Показы, план', width: 14 },
  { header: 'Показы, факт', width: 14 },
  { header: 'Выполнение', width: 12 },
  { header: 'Итог', width: 18 },
  { header: 'Примечание', width: 38 },
  { header: 'Ссылка', width: 40 },
]
const LINK_COLUMN = 'N'

/** Дата для Excel: пояса в нём нет, поэтому кладём время по Ташкенту. */
const local = (moment: Date) => new Date(moment.getTime() + 5 * 3_600_000)

const boxed: Cell = {
  borderStyle: 'thin',
  borderColor: LINE,
  alignVertical: 'top',
}
const textCell = (value: string | null, extra: Cell = {}): Cell => ({
  ...boxed,
  type: String,
  value: value || '—',
  wrap: true,
  ...extra,
})
const numberCell = (value: number | null, format = '#,##0'): Cell =>
  value === null
    ? { ...boxed, type: String, value: '—', align: 'right' }
    : { ...boxed, type: Number, value, format }
const momentCell = (moment: Date | null): Cell =>
  moment
    ? {
        ...boxed,
        type: Date,
        value: local(moment),
        format: 'dd.mm.yyyy hh:mm',
        align: 'left',
      }
    : textCell(null)

/**
 * То, чего библиотека не умеет: настоящие ссылки в ячейках (формула HYPERLINK
 * в просмотрщиках почты пустая) и печать в ширину одной страницы. Порядок
 * элементов листа строгий: sheetPr — первым, hyperlinks — перед печатью.
 */
function sheetExtras(
  links: { ref: string; url: string }[],
): Feature<Stream | Buffer | Blob> {
  const id = (i: number) => `rId-link-${i + 1}`
  const hyperlinks = links.length
    ? `<hyperlinks>${links
        .map((l, i) => `<hyperlink ref="${l.ref}" r:id="${id(i)}"/>`)
        .join('')}</hyperlinks>`
    : ''
  return {
    files: {
      transform: {
        'xl/worksheets/sheet{id}.xml': {
          transform: (xml: string) =>
            xml
              .replace(
                /<worksheet\b[^>]*>/,
                (open) =>
                  `${open}<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>`,
              )
              .replace(
                /<(?:printOptions|pageMargins|pageSetup|drawing)\b|<\/worksheet>/,
                (next) => hyperlinks + next,
              )
              .replace(
                /<pageSetup\b/,
                '<pageSetup fitToWidth="1" fitToHeight="0"',
              ),
        },
        'xl/worksheets/_rels/sheet{id}.xml.rels': {
          insert: () =>
            links
              .map(
                (l, i) =>
                  `<Relationship Id="${id(i)}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${sanitizeAttributeValue(l.url)}" TargetMode="External"/>`,
              )
              .join(''),
        },
      },
    },
  }
}

/** Отчёт по стыковке: шапка, итоги и таблица — одним листом для отправки. */
export async function buildFactsReport({
  rows,
  totals,
  subtitle,
}: {
  rows: CheckedBooking[]
  totals: FactsTotals
  /** Строки под заголовком: период, бренд, когда сформирован. */
  subtitle: string[]
}): Promise<Buffer> {
  const { counts, impressions } = totals
  const summary: [string, number, string?][] = [
    ['Всего публикаций', rows.length],
    [VERDICT.matched.many, counts.matched, VERDICT_COLOR.matched],
    [VERDICT.mismatch.many, counts.mismatch, VERDICT_COLOR.mismatch],
    [VERDICT.missed.many, counts.missed, VERDICT_COLOR.missed],
    [VERDICT.waiting.many, counts.waiting, VERDICT_COLOR.waiting],
    ['Показы, план', impressions.plan],
    ['Показы, факт', impressions.fact],
  ]

  const sheet: (Cell | null)[][] = [
    [
      {
        type: String,
        value: 'Стыковка публикаций',
        fontWeight: 'bold',
        fontSize: 16,
        textColor: INK,
        columnSpan: 6,
      },
    ],
    ...subtitle.map((line): (Cell | null)[] => [
      { type: String, value: line, textColor: MUTED, columnSpan: 6 },
    ]),
    [],
    ...summary.map(([label, value, color]): (Cell | null)[] => [
      null,
      { ...boxed, type: String, value: label },
      {
        ...boxed,
        type: Number,
        value,
        format: '#,##0',
        fontWeight: 'bold',
        align: 'left',
        textColor: color ?? INK,
      },
    ]),
    [],
    COLUMNS.map(({ header }) => ({
      ...boxed,
      type: String,
      value: header,
      fontWeight: 'bold',
      textColor: '#FFFFFF',
      backgroundColor: '#0B1A13',
      alignVertical: 'center',
      wrap: true,
    })),
  ]

  const links: { ref: string; url: string }[] = []
  rows.forEach((r, i) => {
    const fact = r.fact?.outcome === 'published' ? r.fact : null
    const plan = r.fact?.planImpressions ?? r.planImpressions
    const done = fact?.impressions ?? null
    const publishedAt = fact?.publishedAt ? new Date(fact.publishedAt) : null
    if (fact?.link) {
      links.push({ ref: `${LINK_COLUMN}${sheet.length + 1}`, url: fact.link })
    }
    sheet.push([
      { ...numberCell(i + 1, '0'), align: 'left' },
      textCell(r.advertiserName),
      textCell(r.campaignName),
      textCell(r.contractNumber ? `№ ${r.contractNumber}` : null),
      textCell(r.formatName),
      momentCell(plannedAt(r.date, r.time)),
      momentCell(publishedAt),
      numberCell(shiftMinutes(r, r.fact), '+0;-0;0'),
      numberCell(plan || null),
      numberCell(done),
      numberCell(plan && done !== null ? done / plan : null, '0%'),
      textCell(VERDICT[r.verdict].label, {
        fontWeight: 'bold',
        textColor: VERDICT_COLOR[r.verdict],
      }),
      textCell(r.notes.join('; ')),
      textCell(fact?.link ?? null, fact?.link ? { textColor: '#1E6FD9' } : {}),
    ])
  })

  return writeExcelFile(
    sheet,
    {
      sheet: 'Стыковка',
      columns: COLUMNS.map(({ width }) => ({ width })),
      orientation: 'landscape',
      showGridLines: false,
    },
    { fontFamily: 'Calibri', fontSize: 11, features: [sheetExtras(links)] },
  ).toBuffer()
}
