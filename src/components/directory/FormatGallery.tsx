'use client'

import { useRef, useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { MediaThumb } from '@/components/ui/MediaUpload'
import { cn } from '@/lib/cn'
import { fileHref, isVideo } from '@/lib/files'
import type { FormatShowcase } from './FormatMedia'

/**
 * Галерея формата: слева фото и видео со стрелками, справа — что это за
 * формат: цена, описание и состав. Стрелки клавиатуры листают, Esc закрывает.
 */
export function FormatGallery({
  format,
  index,
  onIndex,
  onClose,
}: {
  format: FormatShowcase
  /** null — закрыта. */
  index: number | null
  onIndex: (i: number) => void
  onClose: () => void
}) {
  // Пока доигрывает закрытие, на экране остаётся последний снимок.
  const [last, setLast] = useState(0)
  if (index !== null && index !== last) setLast(index)

  const popup = useRef<HTMLDivElement>(null)
  const { media } = format
  const i = index ?? last
  const current = media[i]
  const many = media.length > 1
  const go = (step: number) => onIndex((i + step + media.length) % media.length)

  if (!current) return null

  return (
    <Dialog.Root open={index !== null} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-forest/75 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        {/* Фокус — на окне, а не в плеере: тот забрал бы стрелки и Esc. */}
        <Dialog.Popup
          ref={popup}
          initialFocus={popup}
          onKeyDown={(e) => {
            // В плеере стрелки перематывают — листать их не заставляем.
            if (!many || e.target instanceof HTMLVideoElement) return
            if (e.key === 'ArrowRight') go(1)
            if (e.key === 'ArrowLeft') go(-1)
          }}
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-7xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto border-t-4 border-indigo-500 bg-forest text-white shadow-lift outline-none transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 md:grid md:grid-cols-[minmax(0,1fr)_22rem] md:overflow-hidden"
        >
          <div className="relative aspect-[4/3] w-full shrink-0 bg-black md:aspect-auto md:h-[min(80dvh,46rem)]">
            {isVideo(current) ? (
              <video
                key={current.pathname}
                src={fileHref(current)}
                controls
                autoPlay
                playsInline
                className="absolute inset-0 h-full w-full object-contain"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- приватный файл через наш маршрут
              <img
                key={current.pathname}
                src={fileHref(current)}
                alt={`${format.name}, ${i + 1} из ${media.length}`}
                className="absolute inset-0 h-full w-full object-contain"
              />
            )}
            {many && (
              <>
                <Arrow label="Предыдущее" side="left" onClick={() => go(-1)} />
                <Arrow label="Следующее" side="right" onClick={() => go(1)} />
              </>
            )}
          </div>

          <div className="flex flex-col gap-5 p-6 pr-14 md:h-[min(80dvh,46rem)] md:overflow-y-auto">
            <div>
              <span
                className="mb-3 block h-1.5 w-10"
                style={{ background: format.color }}
                aria-hidden="true"
              />
              <Dialog.Title className="font-display text-2xl font-bold leading-tight tracking-[-0.015em]">
                {format.name}
              </Dialog.Title>
              <p className="mt-2 font-display text-lg font-bold text-lime-300 tnum">
                {format.price}
              </p>
              <p className="text-xs text-white/60 tnum">
                Показов: {format.impressions.toLocaleString('ru-RU')}
              </p>
            </div>

            {format.description ? (
              <Dialog.Description className="whitespace-pre-line text-sm leading-relaxed text-white/75">
                {format.description}
              </Dialog.Description>
            ) : (
              <Dialog.Description className="sr-only">
                Фото и видео формата
              </Dialog.Description>
            )}

            {format.includes.length > 0 && (
              <div>
                <p className="eyebrow mb-2 text-white/60">Что входит</p>
                <ul className="space-y-1.5">
                  {format.includes.map((item, k) => (
                    <li key={k} className="flex gap-2 text-sm text-white/90">
                      <Check
                        size={15}
                        className="mt-0.5 shrink-0 text-lime-300"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {many && (
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                {media.map((m, k) => (
                  <button
                    key={m.pathname}
                    type="button"
                    aria-label={`Показать ${k + 1} из ${media.length}`}
                    aria-current={k === i || undefined}
                    onClick={() => onIndex(k)}
                    className={cn(
                      'h-12 w-16 overflow-hidden bg-black outline-2 outline-offset-2 transition focus-visible:outline-white',
                      k === i
                        ? 'outline-lime-300'
                        : 'opacity-60 outline-transparent hover:opacity-100',
                    )}
                  >
                    <MediaThumb file={m} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <Dialog.Close
            aria-label="Закрыть"
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center bg-forest/70 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
          >
            <X size={20} />
          </Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Arrow({
  label,
  side,
  onClick,
}: {
  label: string
  side: 'left' | 'right'
  onClick: () => void
}) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-forest/70 text-white transition-colors hover:bg-forest focus-visible:outline-2 focus-visible:outline-white',
        side === 'left' ? 'left-3' : 'right-3',
      )}
    >
      <Icon size={22} />
    </button>
  )
}
