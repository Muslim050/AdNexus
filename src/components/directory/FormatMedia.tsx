'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { MediaThumb } from '@/components/ui/MediaUpload'
import { fileHref, isVideo, type AttachedFile } from '@/lib/files'
import { textOn } from '@/lib/palette'
import { FormatGallery } from './FormatGallery'

export interface FormatShowcase {
  name: string
  color: string
  description: string
  includes: string[]
  impressions: number
  price: string
  media: AttachedFile[]
}

const PEEK_WIDTH = 480
const PEEK_HEIGHT = PEEK_WIDTH * (10 / 16) + 44
const GAP = 12

interface Peek {
  index: number
  top: number
  left: number
}

/** Обложка и миниатюры формата: наведение — крупно, клик — галерея. */
export function FormatMedia({ format }: { format: FormatShowcase }) {
  const { media, name, color } = format
  const [peek, setPeek] = useState<Peek | null>(null)
  const [index, setIndex] = useState<number | null>(null)

  // Крупный снимок встаёт сбоку от миниатюры, а на узком экране не нужен:
  // там и палец, и сама обложка почти во всю ширину.
  const show = (i: number, anchor: HTMLElement) => {
    if (!window.matchMedia('(hover: hover) and (min-width: 1024px)').matches) {
      return
    }
    const r = anchor.getBoundingClientRect()
    const right = r.right + GAP
    const left =
      right + PEEK_WIDTH + GAP <= window.innerWidth
        ? right
        : r.left - GAP - PEEK_WIDTH >= 0
          ? r.left - GAP - PEEK_WIDTH
          : window.innerWidth - PEEK_WIDTH - GAP
    const top = Math.min(
      Math.max(r.top, GAP),
      window.innerHeight - PEEK_HEIGHT - GAP,
    )
    setPeek({ index: i, top: Math.max(top, GAP), left: Math.max(left, GAP) })
  }

  const trigger = (i: number) => ({
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) =>
      show(i, e.currentTarget),
    onMouseLeave: () => setPeek(null),
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      // Фокус возвращается сюда и после закрытия галереи — тогда не мешаем.
      if (e.currentTarget.matches(':focus-visible')) show(i, e.currentTarget)
    },
    onBlur: () => setPeek(null),
    onClick: () => {
      setPeek(null)
      setIndex(i)
    },
  })

  const label = (
    <span
      className="pointer-events-none absolute left-0 top-0 max-w-[85%] truncate px-2.5 py-1 text-[12px] font-bold"
      style={{ background: color, color: textOn(color) }}
    >
      {name}
    </span>
  )

  const peeked = peek && media[peek.index]

  return (
    <>
      {media.length > 0 ? (
        <button
          type="button"
          {...trigger(0)}
          aria-label={`Смотреть: ${name}`}
          className="relative block aspect-video w-full cursor-zoom-in overflow-hidden bg-forest focus-ring"
        >
          <MediaThumb file={media[0]} />
          {label}
          {media.length > 1 && (
            <span className="eyebrow absolute bottom-2 right-2 bg-forest/75 px-1.5 py-0.5 text-white">
              +{media.length - 1} {filesWord(media.length - 1)}
            </span>
          )}
        </button>
      ) : (
        <div className="relative aspect-video overflow-hidden bg-forest">
          <div
            className="flex h-full items-center justify-center bg-hatch"
            style={{ backgroundColor: `${color}1f` }}
          >
            <span className="eyebrow text-ink-muted">Нет превью</span>
          </div>
          {label}
        </div>
      )}

      {media.length > 1 && (
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto border-b border-line p-2">
          {media.map((m, i) => (
            <button
              key={m.pathname}
              type="button"
              {...trigger(i)}
              aria-label={`Смотреть: ${m.name}`}
              className="h-12 w-20 shrink-0 cursor-zoom-in overflow-hidden bg-forest focus-ring"
            >
              <MediaThumb file={m} />
            </button>
          ))}
        </div>
      )}

      {/* Указатель сквозь окно проходит — поэтому оно не мигает. */}
      {peeked &&
        createPortal(
          <div
            aria-hidden="true"
            className="pointer-events-none fixed z-40 overflow-hidden border-t-4 border-indigo-500 bg-forest shadow-lift"
            style={{ top: peek.top, left: peek.left, width: PEEK_WIDTH }}
          >
            <div className="aspect-[16/10] w-full">
              {isVideo(peeked) ? (
                <video
                  key={peeked.pathname}
                  src={fileHref(peeked)}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-contain"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- приватный файл через наш маршрут
                <img
                  src={fileHref(peeked)}
                  alt=""
                  className="h-full w-full object-contain"
                />
              )}
            </div>
            <p className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm font-semibold text-white">
              <span className="truncate">{name}</span>
              {media.length > 1 && (
                <span className="shrink-0 text-xs font-normal text-white/60 tnum">
                  {peek.index + 1} / {media.length}
                </span>
              )}
            </p>
          </div>,
          document.body,
        )}

      <FormatGallery
        format={format}
        index={index}
        onIndex={setIndex}
        onClose={() => setIndex(null)}
      />
    </>
  )
}

function filesWord(n: number) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'файл'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'файла'
  return 'файлов'
}
