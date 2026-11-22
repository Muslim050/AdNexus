/** Файл так, как его хранит сущность: скан договора, ролик, логотип. */
export interface FileLink {
  name?: string
  url?: string | null
}

/**
 * Адрес файла для браузера. Файлы лежат в Vercel Blob и приходят
 * абсолютными ссылками, поэтому адрес отдаём как есть.
 */
export function fileHref(url: string | null | undefined): string | undefined {
  return url || undefined
}

/** Сохранить файл на диск. */
export function downloadFile(file: FileLink | null | undefined): void {
  const href = fileHref(file?.url)
  if (!href) return
  const link = document.createElement('a')
  link.href = href
  link.download = file?.name ?? ''
  link.rel = 'noopener'
  document.body.append(link)
  link.click()
  link.remove()
}

/** Открыть файл в новой вкладке. */
export function openFile(file: FileLink | null | undefined): void {
  const href = fileHref(file?.url)
  if (href) window.open(href, '_blank', 'noopener')
}
