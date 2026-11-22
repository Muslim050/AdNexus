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
 * лимита функции в 4,5 МБ. Выдаём только admin и только в папки сущностей.
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
        if (!user || user.role !== 'admin') {
          throw new Error('Загружать файлы может только администратор')
        }
        const inFolder = FILE_FOLDERS.some((f) => pathname.startsWith(`${f}/`))
        if (!inFolder || pathname.includes('..')) {
          throw new Error('Недопустимый путь файла')
        }
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_FILE_BYTES,
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
