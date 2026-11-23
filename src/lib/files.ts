/**
 * Файл внутри сущности (скан договора, материалы слота). Лежит в приватном
 * Vercel Blob; в базе — путь, а скачивание идёт через /api/files с проверкой
 * сессии. Публичной ссылки у файла нет.
 */
export interface AttachedFile {
  name: string
  /** Путь в хранилище: contracts/…, bookings/… */
  pathname: string
  size: number
  contentType: string
  /** ISO-время загрузки — подпись «Добавлен …». */
  addedAt: string
}

/** Папки хранилища — по сущностям. Загрузка в другие запрещена. */
// formats — превью форматов, logos — логотипы брендов: их видит любой вошедший.
export const FILE_FOLDERS = [
  'contracts',
  'bookings',
  'formats',
  'logos',
] as const
export type FileFolder = (typeof FILE_FOLDERS)[number]

/** До 200 МБ: сканы и ролики. */
export const MAX_FILE_BYTES = 200 * 1024 * 1024

export const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'text/plain',
  'image/*',
  'video/*',
]

export const fileHref = (
  file: Pick<AttachedFile, 'pathname' | 'name'>,
  download = false,
) =>
  `/api/files?${new URLSearchParams({
    path: file.pathname,
    name: file.name,
    ...(download ? { download: '1' } : {}),
  })}`

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
}

/**
 * Файл из скрытого поля формы (JSON). Принимаем только загруженное
 * в нужную папку — путь чужой папки или мусор отбрасываем.
 */
export function parseAttachedFile(
  raw: FormDataEntryValue | null,
  folder: FileFolder,
): AttachedFile | null {
  if (typeof raw !== 'string' || !raw) return null
  try {
    const f = JSON.parse(raw) as Partial<AttachedFile>
    if (
      typeof f.name !== 'string' ||
      typeof f.pathname !== 'string' ||
      !f.pathname.startsWith(`${folder}/`) ||
      f.pathname.includes('..') ||
      typeof f.size !== 'number'
    ) {
      return null
    }
    return {
      name: f.name.slice(0, 255),
      pathname: f.pathname.slice(0, 500),
      size: f.size,
      contentType: typeof f.contentType === 'string' ? f.contentType : '',
      addedAt:
        typeof f.addedAt === 'string' ? f.addedAt : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

/** Список файлов из скрытого поля (JSON-массив); мусор и чужие папки — мимо. */
export function parseAttachedFiles(
  raw: FormDataEntryValue | null,
  folder: FileFolder,
  max = 20,
): AttachedFile[] {
  if (typeof raw !== 'string' || !raw) return []
  try {
    const list = JSON.parse(raw)
    if (!Array.isArray(list)) return []
    return list
      .map((item) => parseAttachedFile(JSON.stringify(item), folder))
      .filter((f): f is AttachedFile => f !== null)
      .slice(0, max)
  } catch {
    return []
  }
}

export const isVideo = (f: Pick<AttachedFile, 'contentType' | 'name'>) =>
  f.contentType.startsWith('video/') || /\.(mp4|mov|webm|m4v)$/i.test(f.name)

/** Папки без секретов — витрина: доступны любому вошедшему. */
export const isShowcase = (pathname: string) =>
  pathname.startsWith('formats/') || pathname.startsWith('logos/')

/**
 * Что можно открыть прямо в браузере. SVG и прочее, что способно выполнить
 * скрипт на нашем домене, — только скачиванием (в <img> оно всё равно видно).
 */
export const opensInline = (contentType: string) =>
  /^(application\/pdf|image\/(png|jpe?g|gif|webp|avif|heic)|video\/[\w.+-]+|text\/plain)(;|$)/i.test(
    contentType,
  )
