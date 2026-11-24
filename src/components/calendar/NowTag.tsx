import { cn } from '@/lib/cn'

/** Ярлык с текущим временем над красной полосой — виден при наведении. */
export function NowTag({
  time,
  shown,
  className,
}: {
  time: string
  /** Не задано — показом управляет className (group-hover). */
  shown?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'pointer-events-none absolute bottom-[6px] left-2 whitespace-nowrap bg-danger px-1.5 py-[3px] font-mono text-[11px] font-semibold leading-none text-white tnum shadow-lift transition-opacity duration-100',
        !shown && 'opacity-0',
        className,
      )}
    >
      Сейчас {time}
    </span>
  )
}
