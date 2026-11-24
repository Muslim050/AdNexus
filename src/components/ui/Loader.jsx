import { Logo } from '@/components/Logo'
import { cn } from '@/lib/cn'

/**
 * Ожидание: знак AdNexus с подписью, под ней бежит изумрудная полоса
 * по тонкой направляющей. `full` растягивает лоадер на весь экран — это вход
 * в платформу; без него лоадер занимает место содержимого, пока данные
 * раздела не пришли.
 *
 * @param {{
 *   label?: string,
 *   size?: number,
 *   full?: boolean,
 *   className?: string,
 * }} props
 */
export function Loader({ label, full = false, className }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        'flex flex-col items-center justify-center gap-6',
        // Без `full` — на месте содержимого раздела: заголовок и вкладки уже
        // видны. Высота с запасом, чтобы на время загрузки не появлялась
        // прокрутка.
        full
          ? 'min-h-screen bg-paper'
          : 'min-h-[max(240px,calc(100dvh-440px))] flex-1',
        className,
      )}
    >
      <Logo size={52} />

      {/* Направляющая с бегущим отрезком. */}
      <div className="relative h-[3px] w-48 overflow-hidden bg-ink/10">
        <span className="absolute inset-y-0 left-0 w-2/5 animate-scan bg-indigo-500" />
      </div>

      {label ? (
        <p className="eyebrow text-ink-muted">{label}</p>
      ) : (
        <p className="eyebrow text-ink-muted">Загрузка</p>
      )}
      <span className="sr-only">Загрузка</span>
    </div>
  )
}
