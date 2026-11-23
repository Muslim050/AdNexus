import { NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { getCurrentUser } from '@/lib/auth'
import {
  ALLOWED_CONTENT_TYPES,
  FILE_FOLDERS,
  MAX_FILE_BYTES,
} from '@/lib/files'

/**
 * Токен для загрузки файла из браузера прямо в приватный Blob — так нет
 * лимита функции в 4,5 МБ. admin грузит в папки сущностей, рекламодатель —
 * только материалы своих броней.
 */
export async function POST(request: Request) {
  let body: HandleUploadBody
  try {
    body = (await request.json()) as HandleUploadBody
  } catch {
    return NextResponse.json({ error: 'Неверный запрос' }, { status: 400 })
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const user = await getCurrentUser()
        // admin — в любые папки сущностей; рекламодатель — только материалы брони.
        const folders: readonly string[] =
          user?.role === 'admin'
            ? FILE_FOLDERS
            : user?.role === 'advertiser' && user.advertiserId
              ? ['bookings']
              : []
        if (!folders.length) throw new Error('Нет прав на загрузку файлов')
        const inFolder = folders.some((f) => pathname.startsWith(`${f}/`))
        if (!inFolder || pathname.includes('..')) {
          throw new Error('Недопустимый путь файла')
        }
        const logo = pathname.startsWith('logos/')
        return {
          allowedContentTypes: logo ? ['image/*'] : ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: logo ? 5 * 1024 * 1024 : MAX_FILE_BYTES,
          // Одинаковые имена файлов не перезаписывают друг друга.
          addRandomSuffix: true,
        }
      },
    })
    return NextResponse.json(result)
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Не удалось начать загрузку'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
