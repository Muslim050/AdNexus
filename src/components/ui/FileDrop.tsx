'use client'

import { useRef, useState, type DragEvent } from 'react'
import { upload } from '@vercel/blob/client'
import { CloudUpload, Download, FileText, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  MAX_FILE_BYTES,
  fileHref,
  formatBytes,
  type AttachedFile,
  type FileFolder,
} from '@/lib/files'
import { useField } from './Field'
import { Progress } from './Progress'

interface FileDropProps {
  /** Имя скрытого поля: уходит JSON-описанием файла или пустой строкой. */
  name: string
  folder: FileFolder
  defaultValue?: AttachedFile | null
  hint?: string
  invalid?: boolean
  /** Только картинки — для логотипа: 'image/*'. */
  accept?: 'image/*'
  maxBytes?: number
}

/** Безопасное имя для пути: буквы, цифры, точка, дефис. Кириллица остаётся. */
const safeName = (name: string) =>
  name.replace(/[^\p{L}\p{N}._-]+/gu, '_').slice(-120) || 'file'

/**
 * Загрузка файла перетаскиванием или выбором. Файл уходит из браузера прямо
 * в приватный Blob с прогрессом и отменой; в форму попадает его описание.
 */
export function FileDrop({
  name,
  folder,
  defaultValue = null,
  hint = 'PDF, Word, Excel, изображения или видео — до 200 МБ',
  invalid,
  accept,
  maxBytes = MAX_FILE_BYTES,
}: FileDropProps) {
  const [file, setFile] = useState<AttachedFile | null>(defaultValue)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const field = useField()
  const flagged = invalid || field?.invalid
  const abortRef = useRef<AbortController | null>(null)

  const start = async (picked: File) => {
    setError('')
    if (accept && !picked.type.startsWith('image/')) {
      setError('Нужна картинка')
      return
    }
    if (picked.size > maxBytes) {
      setError(`Файл больше ${formatBytes(maxBytes)}`)
      return
    }
    const controller = new AbortController()
    abortRef.current = controller
    setProgress(0)
    try {
      const blob = await upload(`${folder}/${safeName(picked.name)}`, picked, {
        access: 'private',
        handleUploadUrl: '/api/files/upload',
        multipart: picked.size > 20 * 1024 * 1024,
        abortSignal: controller.signal,
        onUploadProgress: ({ percentage }) =>
          setProgress(Math.round(percentage)),
      })
      setFile({
        name: picked.name,
        pathname: blob.pathname,
        size: picked.size,
        contentType: blob.contentType || picked.type,
        addedAt: new Date().toISOString(),
      })
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(
          err instanceof Error && err.message
            ? err.message
            : 'Не удалось загрузить файл',
        )
      }
    } finally {
      setProgress(null)
      abortRef.current = null
    }
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    const picked = event.dataTransfer.files?.[0]
    if (picked && progress === null) void start(picked)
  }

  const uploading = progress !== null

  return (
    <div data-uploading={uploading || undefined} className="space-y-1.5">
      <input
        type="hidden"
        name={name}
        value={file ? JSON.stringify(file) : ''}
      />
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const picked = e.target.files?.[0]
          if (picked) void start(picked)
          e.target.value = ''
        }}
      />

      {file && !uploading ? (
        <div className="flex items-center gap-3 border border-line bg-surface px-3 py-2.5">
          {file.contentType.startsWith('image/') ? (
            // eslint-disable-next-line @next/next/no-img-element -- приватный файл через наш маршрут
            <img
              src={fileHref(file)}
              alt=""
              className="h-11 w-11 shrink-0 border border-line bg-white object-contain p-0.5"
            />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-indigo-50 text-indigo-600">
              <FileText size={18} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <a
              href={fileHref(file)}
              target="_blank"
              rel="noopener"
              className="block truncate text-sm font-semibold text-ink hover:text-indigo-600 hover:underline"
            >
              {file.name}
            </a>
            <p className="text-xs text-ink-muted tnum">
              {formatBytes(file.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="px-2 py-1 text-xs font-semibold text-ink-soft hover:text-ink focus-ring"
          >
            Заменить
          </button>
          <button
            type="button"
            onClick={() => setFile(null)}
            aria-label="Убрать файл"
            className="flex h-8 w-8 items-center justify-center text-ink-muted hover:bg-danger/8 hover:text-danger focus-ring"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={uploading ? -1 : 0}
          aria-label="Загрузить файл"
          aria-describedby={field?.describedBy}
          // Помечаем для фокуса на первой ошибке формы.
          data-invalid={flagged || undefined}
          onClick={() => !uploading && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (!uploading && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragOver={(e) => {
            e.preventDefault()
            if (!uploading) setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-2 border-2 border-dashed px-4 py-6 text-center transition-colors focus-ring',
            uploading
              ? 'cursor-default border-indigo-300 bg-indigo-50/50'
              : 'cursor-pointer bg-hatch hover:border-indigo-400 hover:bg-indigo-50/40',
            dragging ? 'border-indigo-500 bg-indigo-50' : 'border-ink/18',
            (flagged || error) && !dragging && 'border-danger/60',
          )}
        >
          {uploading ? (
            <div className="w-full max-w-xs space-y-2">
              <p className="text-sm font-semibold text-ink tnum">
                Загружаем… {progress} %
              </p>
              <Progress value={progress} />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  abortRef.current?.abort()
                }}
                className="text-xs font-semibold text-ink-muted hover:text-danger"
              >
                Отменить
              </button>
            </div>
          ) : (
            <>
              <CloudUpload
                size={26}
                strokeWidth={1.6}
                className={dragging ? 'text-indigo-600' : 'text-ink-muted'}
              />
              <p className="text-sm text-ink-soft">
                {dragging ? (
                  'Отпустите, чтобы загрузить'
                ) : (
                  <>
                    Перетащите файл сюда или{' '}
                    <span className="font-semibold text-indigo-600 underline underline-offset-2">
                      выберите
                    </span>
                  </>
                )}
              </p>
              <p className="text-xs text-ink-muted">{hint}</p>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

/** Файл только на чтение: иконка, имя-ссылка, размер. */
export function FileLink({ file }: { file: AttachedFile }) {
  return (
    <a
      href={fileHref(file)}
      target="_blank"
      rel="noopener"
      className="group inline-flex min-w-0 max-w-full items-center gap-2 text-sm font-semibold text-indigo-600 hover:underline"
    >
      <FileText size={15} className="shrink-0" />
      <span className="truncate">{file.name}</span>
      <span className="shrink-0 font-normal text-ink-muted tnum">
        {formatBytes(file.size)}
      </span>
    </a>
  )
}

/** Файл карточкой: иконка, имя, размер и действия «Открыть» / «Скачать». */
export function FileCard({
  label,
  file,
}: {
  label: string
  file: AttachedFile
}) {
  return (
    <div className="flex items-center gap-3 border border-line bg-surface px-3 py-2.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-indigo-50 text-indigo-600">
        <FileText size={19} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="eyebrow text-ink-muted">{label}</p>
        <a
          href={fileHref(file)}
          target="_blank"
          rel="noopener"
          className="mt-0.5 block truncate text-sm font-semibold text-ink hover:text-indigo-600 hover:underline"
        >
          {file.name}
        </a>
        <p className="text-xs text-ink-muted tnum">{formatBytes(file.size)}</p>
      </div>
      <a
        href={fileHref(file, true)}
        aria-label={`Скачать ${file.name}`}
        title="Скачать"
        className="flex h-9 w-9 shrink-0 items-center justify-center border border-line text-ink-soft transition-colors hover:border-ink hover:text-ink focus-ring"
      >
        <Download size={16} />
      </a>
    </div>
  )
}
