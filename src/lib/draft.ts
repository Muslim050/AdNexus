import { useEffect, useRef, type RefObject } from 'react'

/** Значения формы при открытии — с ними сравниваем перед закрытием окна. */
const initial = new WeakMap<HTMLFormElement, string>()

const serialize = (form: HTMLFormElement) =>
  JSON.stringify(
    [...new FormData(form)].map(([name, value]) => [
      name,
      typeof value === 'string' ? value : value.name,
    ]),
  )

/** Ref для формы, которую окно не должно закрыть молча с введёнными данными. */
export function useDraftRef() {
  const ref = useRef<HTMLFormElement>(null)
  useEffect(() => {
    const form = ref.current
    if (!form) return
    // Следующим тиком: скрытые поля списков заполняются в своих эффектах.
    const id = setTimeout(() => initial.set(form, serialize(form)))
    return () => clearTimeout(id)
  }, [])
  return ref
}

/** В форме есть несохранённое: значения изменились или грузится файл. */
export function hasDraft(form: HTMLFormElement) {
  const before = initial.get(form)
  if (before === undefined) return false
  return (
    form.querySelector('[data-uploading]') !== null ||
    before !== serialize(form)
  )
}

/**
 * После ответа с ошибками — фокус на первое неверное поле, а без него — на
 * общую ошибку формы: так её прочитает и экранный диктор.
 */
export function useFocusFirstError(
  ref: RefObject<HTMLFormElement | null>,
  state: { error?: string; errors?: Record<string, string> },
) {
  useEffect(() => {
    if (!state.error && !state.errors) return
    const form = ref.current
    const target =
      form?.querySelector<HTMLElement>(
        '[aria-invalid="true"], [data-invalid]',
      ) ?? form?.querySelector<HTMLElement>('[data-form-error]')
    target?.focus()
  }, [ref, state])
}
