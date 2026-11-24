import 'server-only'
import { del } from '@vercel/blob'
import type { AttachedFile } from './files'

/** Удалить файл из Blob, не роняя действие: строка в базе важнее. */
export async function dropFile(file: AttachedFile | null | undefined) {
  if (!file) return
  try {
    await del(file.pathname)
  } catch (err) {
    console.error('Не удалось удалить файл из Blob', file.pathname, err)
  }
}
