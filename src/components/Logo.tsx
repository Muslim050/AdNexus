import { cn } from '@/lib/cn'

export interface LogoProps {
  size?: number
  withWord?: boolean
  /** Логотип на тёмной «вывеске» — надпись становится светлой. */
  inverted?: boolean
  className?: string
}

/**
 * Знак AdNexus: квадрат-стенд с узлом связи в центре — четыре канала
 * сходятся в одну точку. Нарисован в SVG, чтобы не мылился на любом кегле.
 */
export function LogoMark({
  size = 32,
  inverted = false,
}: {
  size?: number
  inverted?: boolean
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect
        width="40"
        height="40"
        fill={inverted ? 'var(--color-lime-300)' : 'var(--color-indigo-500)'}
      />
      <g
        stroke={inverted ? 'var(--color-forest)' : '#fff'}
        strokeWidth="2.5"
        strokeLinecap="square"
        fill="none"
      >
        <path d="M8 8 L17 17 M32 8 L23 17 M8 32 L17 23 M32 32 L23 23" />
        <rect x="16" y="16" width="8" height="8" />
      </g>
      <g fill={inverted ? 'var(--color-forest)' : '#fff'}>
        <rect x="5" y="5" width="5" height="5" />
        <rect x="30" y="5" width="5" height="5" />
        <rect x="5" y="30" width="5" height="5" />
        <rect x="30" y="30" width="5" height="5" />
      </g>
    </svg>
  )
}

export function Logo({
  size = 32,
  withWord = true,
  inverted = false,
  className,
}: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <LogoMark size={size} inverted={inverted} />
      {withWord ? (
        <span
          className={cn(
            'flex min-w-0 flex-col',
            inverted ? 'text-white' : 'text-ink',
          )}
        >
          <span
            className="whitespace-nowrap font-display font-extrabold uppercase leading-none tracking-[0.06em]"
            style={{ fontSize: Math.max(14, size * 0.4) }}
          >
            AdNexus
          </span>
          <span
            className={cn(
              'eyebrow mt-1 whitespace-nowrap leading-none',
              inverted ? 'text-lime-300' : 'text-indigo-600',
            )}
            style={{ fontSize: Math.max(9, size * 0.26) }}
          >
            CRM Platform
          </span>
        </span>
      ) : (
        <span className="sr-only">AdNexus</span>
      )}
    </div>
  )
}
