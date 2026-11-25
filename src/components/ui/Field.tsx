'use client'

import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { ChevronDown, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/cn'

// Поле — прямоугольник с тонкой рамкой; в фокусе рамка изумрудная, а снизу
// проступает плотная кромка, как у бланка.
export const baseControl =
  'w-full rounded-md border border-ink/18 bg-surface px-3.5 text-sm text-ink placeholder:text-ink-muted transition-[border-color,box-shadow] hover:border-ink/35 outline-none focus-visible:border-indigo-500 focus-visible:shadow-[inset_0_-2px_0_var(--color-indigo-500)] disabled:bg-ink/[0.03] disabled:opacity-60'

export interface FieldProps {
  label?: ReactNode
  hint?: ReactNode
  /** Текст ошибки. Непустая строка вытесняет warning и hint. */
  error?: ReactNode
  /** Предупреждение: сохранить можно, но стоит проверить. Вытесняет hint. */
  warning?: ReactNode
  required?: boolean
  children: ReactNode
  className?: string
  /**
   * Группа вместо поля с <label> — для загрузки файлов: подпись у зоны
   * загрузки не должна ещё раз открывать окно выбора файла.
   */
  group?: boolean
}

/** Что поле сообщает своему контролу: id, подпись, пояснение и ошибку. */
interface FieldContext {
  id: string
  labelId: string
  describedBy?: string
  invalid: boolean
}

const FieldCtx = createContext<FieldContext | null>(null)

/** Связи контрола с полем: Input, списки и пикеры берут их отсюда сами. */
export const useField = () => useContext(FieldCtx)

/** aria-атрибуты контрола: явные значения важнее тех, что дало поле. */
export function useFieldAria(
  invalid?: boolean,
  id?: string,
): {
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: true
} {
  const field = useField()
  return {
    id: id ?? field?.id,
    'aria-describedby': field?.describedBy,
    'aria-invalid': invalid || field?.invalid ? true : undefined,
  }
}

const isInvalid = (value: unknown) => value === true || value === 'true'

const labelText =
  'flex items-center gap-1 text-[11.5px] font-bold uppercase tracking-[0.06em] text-ink-soft'

export function Field({
  label,
  hint,
  error,
  warning,
  required,
  children,
  className,
  group = false,
}: FieldProps) {
  const id = useId()
  const labelId = `${id}-label`
  const messageId = `${id}-message`
  const message = error || warning || hint

  const caption = label && (
    <>
      {label}
      {required && (
        <span className="text-danger" aria-hidden="true">
          *
        </span>
      )}
    </>
  )

  return (
    <div
      role={group ? 'group' : undefined}
      aria-labelledby={group && label ? labelId : undefined}
      className={cn('block space-y-1.5', className)}
    >
      {label &&
        (group ? (
          <span id={labelId} className={labelText}>
            {caption}
          </span>
        ) : (
          <label id={labelId} htmlFor={id} className={labelText}>
            {caption}
          </label>
        ))}
      <FieldCtx.Provider
        value={{
          id,
          labelId,
          describedBy: message ? messageId : undefined,
          invalid: !!error,
        }}
      >
        {children}
      </FieldCtx.Provider>
      {error ? (
        <span id={messageId} className="block text-xs text-danger">
          {error}
        </span>
      ) : warning ? (
        <span
          id={messageId}
          className="flex items-start gap-1.5 text-xs leading-snug text-warning"
        >
          <TriangleAlert
            size={13}
            className="mt-px shrink-0"
            aria-hidden="true"
          />
          {warning}
        </span>
      ) : hint ? (
        <span id={messageId} className="block text-xs text-ink-muted">
          {hint}
        </span>
      ) : null}
    </div>
  )
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  const aria = useFieldAria(isInvalid(props['aria-invalid']), props.id)
  return (
    <input
      ref={ref}
      className={cn(baseControl, 'h-11', className)}
      {...props}
      {...aria}
    />
  )
})

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  const aria = useFieldAria(isInvalid(props['aria-invalid']), props.id)
  return (
    <textarea
      ref={ref}
      className={cn(baseControl, 'min-h-[92px] py-2.5 resize-y', className)}
      {...props}
      {...aria}
    />
  )
})

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  const aria = useFieldAria(isInvalid(props['aria-invalid']), props.id)
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          baseControl,
          'h-11 appearance-none pr-9 cursor-pointer',
          className,
        )}
        {...props}
        {...aria}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"
      />
    </div>
  )
})
