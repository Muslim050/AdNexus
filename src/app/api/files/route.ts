import { get } from '@vercel/blob'
import { and, eq, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { bookings, contracts } from '@/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { FILE_FOLDERS } from '@/lib/files'

/**
 * Отдаёт файл из приватного Blob вошедшему пользователю. Сотрудникам — любой,
 * рекламодателю — только файлы его договоров и броней.
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
    // Превью форматов — витрина, их видит любой вошедший.
    !path.startsWith('formats/') &&
    !(await ownsFile(user.advertiserId, path))
  ) {
    return new Response('Нет доступа', { status: 403 })
  }

  const result = await get(path, { access: 'private' })
  if (!result || result.statusCode !== 200) {
    return new Response('Файл не найден', { status: 404 })
  }

  const name = (url.searchParams.get('name') || path.split('/').pop() || 'file')
    .replace(/[\r\n"]/g, '')
    .slice(0, 255)
  const disposition = url.searchParams.get('download') ? 'attachment' : 'inline'

  return new Response(result.stream, {
    headers: {
      'Content-Type': result.blob.contentType || 'application/octet-stream',
      'Content-Length': String(result.blob.size),
      // Имя в UTF-8 — кириллица в названии файла не ломается.
      'Content-Disposition': `${disposition}; filename="file"; filename*=UTF-8''${encodeURIComponent(name)}`,
      'Cache-Control': 'private, no-store',
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
  return Boolean(booking)
}
