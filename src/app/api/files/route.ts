import { get } from '@vercel/blob'
import { and, eq, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { bookingFacts, bookings, contracts } from '@/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { FILE_FOLDERS, isShowcase, opensInline } from '@/lib/files'

/**
 * Отдаёт файл из приватного Blob вошедшему пользователю. Сотрудникам — любой,
 * рекламодателю — только файлы его договоров, броней и их стыковки.
 *
 *   /api/files?path=contracts/scan-abc.pdf&name=Договор.pdf[&download=1]
 */
export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return new Response('Нужен вход', { status: 401 })

  const url = new URL(request.url)
  const path = url.searchParams.get('path') ?? ''
  const inFolder = FILE_FOLDERS.some((f) => path.startsWith(`${f}/`))
  if (!inFolder || path.includes('..')) {
    return new Response('Файл не найден', { status: 404 })
  }

  // Рекламодателю — только файлы своего бренда: его договоры и брони.
  if (
    user.role === 'advertiser' &&
    // Превью форматов и логотипы — витрина, их видит любой вошедший.
    !isShowcase(path) &&
    !(await ownsFile(user.advertiserId, path))
  ) {
    return new Response('Нет доступа', { status: 403 })
  }

  // Плееру нужны куски файла: без Range Safari видео не играет, а Chrome
  // не перематывает.
  const range = request.headers.get('range')
  const result = await get(path, {
    access: 'private',
    headers: range ? { range } : undefined,
  })
  if (!result || result.statusCode !== 200) {
    return new Response('Файл не найден', { status: 404 })
  }

  const name = (url.searchParams.get('name') || path.split('/').pop() || 'file')
    .replace(/[\r\n"]/g, '')
    .slice(0, 255)
  const contentType = result.blob.contentType || 'application/octet-stream'
  const disposition =
    url.searchParams.get('download') || !opensInline(contentType)
      ? 'attachment'
      : 'inline'

  const contentRange = result.headers.get('content-range')
  const length = contentRange
    ? result.headers.get('content-length')
    : String(result.blob.size)

  return new Response(result.stream, {
    status: contentRange ? 206 : 200,
    headers: {
      'Content-Type': contentType,
      ...(length ? { 'Content-Length': length } : {}),
      ...(contentRange ? { 'Content-Range': contentRange } : {}),
      'Accept-Ranges': 'bytes',
      // Имя в UTF-8 — кириллица в названии файла не ломается.
      'Content-Disposition': `${disposition}; filename="file"; filename*=UTF-8''${encodeURIComponent(name)}`,
      // Имя файла в Blob уникально, поэтому витрину браузер может хранить.
      'Cache-Control': isShowcase(path)
        ? 'private, max-age=86400, immutable'
        : 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

async function ownsFile(advertiserId: string | null, path: string) {
  if (!advertiserId) return false
  const db = getDb()
  const [contract] = await db
    .select({ id: contracts.id })
    .from(contracts)
    .where(
      and(
        eq(contracts.advertiserId, advertiserId),
        sql`${contracts.file}->>'pathname' = ${path}`,
      ),
    )
    .limit(1)
  if (contract) return true
  const [booking] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.advertiserId, advertiserId),
        sql`${bookings.file}->>'pathname' = ${path}`,
      ),
    )
    .limit(1)
  if (booking) return true
  const [fact] = await db
    .select({ id: bookingFacts.bookingId })
    .from(bookingFacts)
    .innerJoin(bookings, eq(bookings.id, bookingFacts.bookingId))
    .where(
      and(
        eq(bookings.advertiserId, advertiserId),
        sql`${bookingFacts.screenshot}->>'pathname' = ${path}`,
      ),
    )
    .limit(1)
  return Boolean(fact)
}
