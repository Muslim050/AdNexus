/** Переключатель-строка: подпись, пояснение и ползунок; в форму уходит 'on'. */
export function SwitchRow({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string
  label: string
  hint?: string
  defaultChecked?: boolean
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 border border-line bg-paper/60 px-4 py-3">
      <span className="min-w-0">
        <span className="block text-[13.5px] font-semibold text-ink">
          {label}
        </span>
        {hint && <span className="block text-xs text-ink-muted">{hint}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        name={name}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative h-6 w-11 shrink-0 bg-ink/20 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:bg-white after:transition-transform peer-checked:bg-indigo-500 peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 peer-focus-visible:ring-offset-2"
      />
    </label>
  )
}
