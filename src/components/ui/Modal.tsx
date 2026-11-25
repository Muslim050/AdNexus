'use client'

import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { Dialog } from '@base-ui/react/dialog'
import { X, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import { hasDraft } from '@/lib/draft'
import { fileHref } from '@/features/files/download'
import { Button } from './Button'

const CloseCtx = createContext<() => void>(() => {})

/** Закрыть окно, в котором стоит компонент, — с вопросом о несохранённом. */
export const useModalClose = () => useContext(CloseCtx)

// Первое поле формы: с него начинают, а не с крестика в шапке.
const FIRST_FIELD =
  'form :is(input, textarea, button):not([type="hidden"]):not([tabindex="-1"]):not([aria-hidden="true"]):not(:disabled)'

const backdrop =
  'fixed inset-0 z-50 bg-forest/55 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none'

const dialogMotion =
  'transition-[opacity,translate] duration-200 ease-[cubic-bezier(0.2,0.9,0.3,1)] data-starting-style:translate-y-3 data-starting-style:opacity-0 data-ending-style:translate-y-2 data-ending-style:opacity-0 motion-reduce:transition-none'

const drawerMotion =
  'transition-[translate] duration-300 ease-[cubic-bezier(0.2,0.9,0.3,1)] data-starting-style:translate-x-full data-ending-style:translate-x-full data-ending-style:duration-200 data-ending-style:ease-in motion-reduce:transition-none'

// Формы и карточки открываются боковой панелью во всю высоту экрана —
// ширина зависит от размера. Короткие предупреждения (sm или без тела)
// остаются диалогом по центру: панель на одну фразу выглядела бы пустой.
const drawerWidths: Record<string, string> = {
  md: 'sm:w-[520px]',
  lg: 'sm:w-[680px]',
  xl: 'sm:w-[860px]',
}

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  icon?: LucideIcon
  /** Логотип бренда ссылкой или готовым элементом — вместо иконки. */
  logo?: string | ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Диалог по центру пошире — для карточек с блоками. */
  wide?: boolean
}

export function Modal({
  open,
  onClose,
  title,
  description,
  icon: Icon,
  // Логотип бренда — показываем вместо иконки, если он есть.
  logo,
  children,
  footer,
  size = 'md',
  wide = false,
}: ModalProps) {
  const logoSrc = fileHref(typeof logo === 'string' ? logo : null)
  const hasBody = children != null && children !== false
  const asDialog = size === 'sm' || !hasBody

  const popup = useRef<HTMLDivElement>(null)
  const [asking, setAsking] = useState(false)

  // Esc, крестик, фон и «Отмена» — через одну проверку: введённое не теряем.
  const requestClose = () => {
    const forms = popup.current?.querySelectorAll('form') ?? []
    if ([...forms].some(hasDraft)) setAsking(true)
    else onClose()
  }

  const mark =
    logo && typeof logo !== 'string' ? (
      <span className="flex shrink-0 items-center">{logo}</span>
    ) : logoSrc ? (
      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden bg-white">
        <img
          src={logoSrc}
          alt=""
          className="h-full w-full object-contain p-1"
        />
      </span>
    ) : (
      Icon && (
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center',
            asDialog
              ? 'bg-indigo-50 text-indigo-600'
              : 'bg-lime-300 text-forest',
          )}
        >
          <Icon size={20} strokeWidth={2} />
        </div>
      )
    )

  const header = (
    <div
      className={cn(
        'flex items-start gap-3.5 px-4 sm:px-6',
        asDialog
          ? 'pb-2 pt-6'
          : 'border-b border-forest-line bg-forest py-5 text-white',
      )}
    >
      {mark}
      <div className="min-w-0 flex-1 pt-0.5">
        <Dialog.Title
          className={cn(
            'font-display text-lg font-bold leading-snug tracking-[-0.015em]',
            asDialog ? 'text-ink' : 'text-white',
          )}
        >
          {title}
        </Dialog.Title>
        {description && (
          <Dialog.Description
            className={cn(
              'mt-1 text-[13px] leading-relaxed',
              asDialog ? 'text-ink-muted' : 'text-white/60',
            )}
          >
            {description}
          </Dialog.Description>
        )}
      </div>
      <Dialog.Close
        aria-label="Закрыть"
        className={cn(
          '-mr-2 flex h-9 w-9 shrink-0 items-center justify-center transition-colors focus-ring',
          asDialog
            ? 'text-ink-muted hover:bg-ink/6 hover:text-ink'
            : 'text-white/60 hover:bg-white/10 hover:text-white',
        )}
      >
        <X size={19} />
      </Dialog.Close>
    </div>
  )

  const body = hasBody && (
    <div className="min-h-0 flex-1 scroll-pb-28 overflow-y-auto px-4 py-5 sm:px-6">
      {children}
    </div>
  )

  const foot = footer && (
    <div
      className={cn(
        'flex flex-wrap items-center justify-end gap-2 px-4 py-4 sm:px-6',
        asDialog ? 'pb-6' : 'border-t border-line bg-paper',
      )}
    >
      {footer}
    </div>
  )

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && requestClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop forceRender className={backdrop} />
        <Dialog.Viewport
          className={cn(
            'fixed inset-0 z-50 flex',
            asDialog ? 'items-center justify-center p-3 sm:p-4' : 'justify-end',
          )}
        >
          <Dialog.Popup
            ref={popup}
            // На тач-экране — само окно: поле сразу подняло бы клавиатуру.
            initialFocus={() =>
              window.matchMedia('(pointer: coarse)').matches
                ? popup.current
                : (popup.current?.querySelector<HTMLElement>(FIRST_FIELD) ??
                  popup.current)
            }
            className={cn(
              'relative flex w-full flex-col bg-surface shadow-lift outline-none',
              asDialog
                ? cn(
                    'max-h-[92dvh] overflow-hidden border-t-4 border-indigo-500',
                    wide ? 'max-w-2xl' : 'max-w-md',
                    dialogMotion,
                  )
                : cn('h-full', drawerWidths[size], drawerMotion),
            )}
          >
            <CloseCtx.Provider value={requestClose}>
              {header}
              {body}
              {foot}
            </CloseCtx.Provider>
            <LeaveDialog
              open={open && asking}
              onStay={() => setAsking(false)}
              onLeave={() => {
                setAsking(false)
                onClose()
              }}
            />
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** Вопрос перед закрытием окна с несохранёнными данными. */
function LeaveDialog({
  open,
  onStay,
  onLeave,
}: {
  open: boolean
  onStay: () => void
  onLeave: () => void
}) {
  const stay = useRef<HTMLButtonElement>(null)
  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => !next && onStay()}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop forceRender className={backdrop} />
        <AlertDialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <AlertDialog.Popup
            // Enter по привычке не должен стирать введённое.
            initialFocus={stay}
            className={cn(
              'w-full max-w-md border-t-4 border-indigo-500 bg-surface p-6 shadow-lift outline-none',
              dialogMotion,
            )}
          >
            <AlertDialog.Title className="font-display text-lg font-bold leading-snug tracking-[-0.015em] text-ink">
              Закрыть без сохранения?
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              Введённые данные пропадут.
            </AlertDialog.Description>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button variant="danger" onClick={onLeave}>
                Закрыть без сохранения
              </Button>
              <AlertDialog.Close ref={stay} render={<Button />}>
                Вернуться к форме
              </AlertDialog.Close>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
