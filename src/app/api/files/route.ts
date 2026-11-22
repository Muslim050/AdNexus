import { get } from '@vercel/blob'
import { getCurrentUser } from '@/lib/auth'
import { FILE_FOLDERS } from '@/lib/files'

/**
 * Отдаёт файл из приватного Blob вошедшему сотруднику. Рекламодателям
 * договоры и материалы площадки не отдаём.
 *
 *   /api/files?path=contracts/scan-abc.pdf&name=Договор.pdf[&download=1]
 */
export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return new Response('Нужен вход', { status: 401 })
  if (user.role === 'advertiser')
    return new Response('Нет доступа', { status: 403 })

  const url = new URL(request.url)
  const path = url.searchParams.get('path') ?? ''
  const inFolder = FILE_FOLDERS.some((f) => path.startsWith(`${f}/`))
  if (!inFolder || path.includes('..')) {
    return new Response('Файл не найден', { status: 404 })
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
