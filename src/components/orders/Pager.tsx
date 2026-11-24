import { ChevronLeft, ChevronRight } from 'lucide-react'

const button =
  'flex h-9 w-9 items-center justify-center border border-line bg-surface hover:border-ink disabled:opacity-40 focus-ring'

/** Какие записи показаны и листание страниц. */
export function Pager({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number
  pageSize: number
  total: number
  onPage: (page: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-ink-muted">
      <span className="font-mono text-[13px] tnum">
        {total
          ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} из ${total}`
          : '0'}
      </span>
      <div className="flex gap-1">
        <button
          type="button"
          aria-label="Предыдущая страница"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className={button}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          aria-label="Следующая страница"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className={button}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
