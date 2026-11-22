'use client'

import { useRef, useState, type DragEvent } from 'react'
import { upload } from '@vercel/blob/client'
import { ImagePlus, Play, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  MAX_FILE_BYTES,
  fileHref,
  formatBytes,
  isVideo,
  type AttachedFile,
  type FileFolder,
} from '@/lib/files'
import { Progress } from './Progress'

interface Pending {
  key: string
  name: string
  progress: number
}

const safeName = (name: string) =>
  name.replace(/[^\p{L}\p{N}._-]+/gu, '_').slice(-120) || 'file'

/**
 * Фото и видео с превью: несколько файлов, перетаскивание, прогресс у
 * каждого. Первый файл — обложка. В форму уходит JSON-список файлов.
 */
export function MediaUpload({
  name,
  folder,
  defaultValue = [],
  max = 10,
}: {
  name: string
  folder: FileFolder
  defaultValue?: AttachedFile[]
  max?: number
}) {
  const [items, setItems] = useState<AttachedFile[]>(defaultValue)
  const [pending, setPending] = useState<Pending[]>([])
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const left = max - items.length - pending.length

  const start = (files: File[]) => {
    setError('')
    const media = files.filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/'),
    )
    if (media.length < files.length) setError('Можно только фото и видео')
    const batch = media.slice(0, Math.max(left, 0))
    if (media.length > batch.length) setError(`Не больше ${max} файлов`)

    for (const file of batch) {
      if (file.size > MAX_FILE_BYTES) {
        setError(`«${file.name}» больше ${formatBytes(MAX_FILE_BYTES)}`)
        continue
      }
      const key = `${file.name}-${file.size}-${Math.random()}`
      setPending((p) => [...p, { key, name: file.name, progress: 0 }])
      upload(`${folder}/${safeName(file.name)}`, file, {
        access: 'private',
        handleUploadUrl: '/api/files/upload',
        multipart: file.size > 20 * 1024 * 1024,
        onUploadProgress: ({ percentage }) =>
          setPending((p) =>
            p.map((x) =>
              x.key === key ? { ...x, progress: Math.round(percentage) } : x,
            ),
          ),
      })
        .then((blob) =>
          setItems((list) => [
            ...list,
            {
              name: file.name,
              pathname: blob.pathname,
              size: file.size,
              contentType: blob.contentType || file.type,
              addedAt: new Date().toISOString(),
            },
          ]),
        )
        .catch((err) =>
          setError(
            err instanceof Error && err.message
              ? err.message
              : `Не удалось загрузить «${file.name}»`,
          ),
        )
        .finally(() => setPending((p) => p.filter((x) => x.key !== key)))
    }
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    start([...(event.dataTransfer.files ?? [])])
  }

  // Обложкой делаем выбранный файл — переносим его в начало.
  const makeCover = (pathname: string) =>
    setItems((list) => {
      const picked = list.find((f) => f.pathname === pathname)
      return picked
        ? [picked, ...list.filter((f) => f.pathname !== pathname)]
        : list
    })

  return (
    <div
      data-uploading={pending.length ? true : undefined}
      className="space-y-2"
    >
      <input type="hidden" name={name} value={JSON.stringify(items)} />
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          start([...(e.target.files ?? [])])
          e.target.value = ''
        }}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'grid grid-cols-2 gap-2 border-2 border-dashed p-2 transition-colors sm:grid-cols-3',
          dragging ? 'border-indigo-500 bg-indigo-50' : 'border-ink/15',
        )}
      >
        {items.map((file, i) => (
          <figure
            key={file.pathname}
            className="group relative aspect-video overflow-hidden bg-forest"
          >
            <MediaThumb file={file} />
            {i === 0 ? (
              <span className="eyebrow absolute left-1.5 top-1.5 bg-lime-300 px-1.5 py-0.5 text-forest">
                Обложка
              </span>
            ) : (
              <button
                type="button"
                onClick={() => makeCover(file.pathname)}
                className="eyebrow absolute left-1.5 top-1.5 bg-white/90 px-1.5 py-0.5 text-ink opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                Сделать обложкой
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                setItems((list) =>
                  list.filter((f) => f.pathname !== file.pathname),
                )
              }
              aria-label={`Убрать ${file.name}`}
              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center bg-white/90 text-ink hover:bg-danger hover:text-white focus-ring"
            >
              <X size={14} />
            </button>
          </figure>
        ))}

        {pending.map((p) => (
          <div
            key={p.key}
            className="flex aspect-video flex-col justify-center gap-2 bg-indigo-50 px-3"
          >
            <p className="truncate text-xs font-semibold text-ink">{p.name}</p>
            <Progress value={p.progress} />
            <p className="text-[11px] text-ink-muted tnum">{p.progress} %</p>
          </div>
        ))}

        {left > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-video flex-col items-center justify-center gap-1.5 bg-hatch text-center text-ink-muted transition-colors hover:bg-indigo-50/60 hover:text-indigo-600 focus-ring"
          >
            <ImagePlus size={22} strokeWidth={1.6} />
            <span className="px-2 text-[12px] font-semibold leading-tight">
              {dragging ? 'Отпустите файлы' : 'Фото или видео'}
            </span>
            <span className="text-[10.5px]">перетащите или выберите</span>
          </button>
        )}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

/** Миниатюра: фото — картинкой, видео — первым кадром со значком. */
export function MediaThumb({
  file,
  className,
}: {
  file: AttachedFile
  className?: string
}) {
  if (isVideo(file)) {
    return (
      <span className={cn('relative block h-full w-full', className)}>
        <video
          src={`${fileHref(file)}#t=0.1`}
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-8 w-8 items-center justify-center bg-forest/70 text-white">
            <Play size={15} fill="currentColor" />
          </span>
        </span>
      </span>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- приватный файл через наш маршрут, next/image его не оптимизирует
    <img
      src={fileHref(file)}
      alt={file.name}
      loading="lazy"
      className={cn('h-full w-full object-cover', className)}
    />
  )
}
