'use client'

import type { ReactNode } from 'react'
import { LayoutGrid, List, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useStoredFlag } from '@/lib/useStoredFlag'

/** Список таблицей или карточками — по выбору в ViewSwitch с тем же ключом. */
export function ListOrGrid({
  storageKey,
  table,
  grid,
}: {
  storageKey: string
  table: ReactNode
  grid: ReactNode
}) {
  const [asGrid] = useStoredFlag(storageKey)
  return asGrid ? grid : table
}

/** Переключатель «Таблица / Карточки»; выбор помнит браузер. */
export function ViewSwitch({
  storageKey,
  caption,
}: {
  storageKey: string
  /** Подпись слева: сколько записей. */
  caption?: ReactNode
}) {
  const [asGrid, setAsGrid] = useStoredFlag(storageKey)
  return (
    <div className="flex items-center gap-4">
      <span className="hidden text-[13px] text-ink-muted tnum sm:inline">
        {caption}
      </span>
      <div
        role="group"
        aria-label="Вид списка"
        className="flex border border-ink/20 bg-surface"
      >
        <Mode
          icon={List}
          label="Таблица"
          on={!asGrid}
          onClick={() => setAsGrid(false)}
        />
        <Mode
          icon={LayoutGrid}
          label="Карточки"
          on={asGrid}
          onClick={() => setAsGrid(true)}
        />
      </div>
    </div>
  )
}

function Mode({
  icon: Icon,
  label,
  on,
  onClick,
}: {
  icon: LucideIcon
  label: string
  on: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      title={label}
      onClick={onClick}
      className={cn(
        'flex h-9 items-center gap-2 px-2.5 text-[13px] font-semibold transition-colors focus-ring sm:px-3',
        on
          ? 'bg-forest text-white'
          : 'text-ink-soft hover:bg-ink/6 hover:text-ink',
      )}
    >
      <Icon size={15} aria-hidden="true" />
      {/* На телефоне в строке с вкладками хватает места только на значок. */}
      <span className="sr-only sm:not-sr-only">{label}</span>
    </button>
  )
}
