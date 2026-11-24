import { Suspense } from 'react'
import type { Metadata } from 'next'
import { BookOpen, Check } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { FormatMedia } from '@/components/directory/FormatMedia'
import { EditFormat, NewFormat } from '@/components/forms/NewFormat'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Loader } from '@/components/ui/Loader'
import { requireSection } from '@/lib/auth'
import { listFormats } from '@/lib/data/formats'
import { formatSum } from '@/lib/forms'
import { isEditor } from '@/lib/roles'

export const metadata: Metadata = { title: 'Справочник' }

const lines = (text: string) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

export default function Page() {
  return (
    <>
      <PageHeader
        title="Справочник"
        subtitle="Форматы публикаций: описание, состав, показы, цена и цвет в календаре."
      >
        <Suspense>
          <CreateAction />
        </Suspense>
      </PageHeader>
      <Suspense fallback={<Loader />}>
        <Formats />
      </Suspense>
    </>
  )
}

async function load() {
  const user = await requireSection('/directory')
  const formats = await listFormats()
  const canManage = isEditor(user.role)
  const takenColors = formats.map((f) => f.color)
  const create = canManage && <NewFormat takenColors={takenColors} />
  return { formats, canManage, takenColors, create }
}

async function CreateAction() {
  const { formats, create } = await load()
  return formats.length > 0 && create
}

async function Formats() {
  const { formats, canManage, takenColors, create } = await load()

  return (
    <>
      {formats.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Форматов пока нет"
          description="Добавьте форматы публикаций — без них слот в календаре не забронировать."
          action={create}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {formats.map((f) => {
            const included = lines(f.includes)
            const total = f.impressions * Number(f.pricePerImpression)
            return (
              <article
                key={f.id}
                className="flex flex-col border border-line bg-surface"
              >
                <FormatMedia
                  format={{
                    name: f.name,
                    color: f.color,
                    description: f.description,
                    includes: included,
                    impressions: f.impressions,
                    price: total ? formatSum(total) : 'Цена не указана',
                    media: f.media,
                  }}
                />

                <div className="flex flex-1 flex-col gap-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-[17px] font-bold leading-snug text-ink">
                      {f.name}
                    </h3>
                    {!f.isActive && <Badge tone="muted">Отключён</Badge>}
                  </div>

                  {f.description && (
                    <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                      {f.description}
                    </p>
                  )}

                  {included.length > 0 && (
                    <div>
                      <p className="eyebrow mb-1.5 text-ink-muted">
                        Что входит
                      </p>
                      <ul className="space-y-1">
                        {included.map((item) => (
                          <li
                            key={item}
                            className="flex gap-2 text-sm text-ink"
                          >
                            <Check
                              size={15}
                              className="mt-0.5 shrink-0 text-indigo-500"
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <dl className="mt-auto grid grid-cols-2 gap-px border border-line bg-line">
                    <Stat
                      label="Показы"
                      value={f.impressions.toLocaleString('ru-RU')}
                    />
                    <Stat
                      label="Цена показа"
                      value={formatSum(f.pricePerImpression)}
                    />
                    <Stat
                      label="Стоимость пакета"
                      value={formatSum(total)}
                      wide
                    />
                  </dl>

                  <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
                    <span className="text-xs text-ink-muted tnum">
                      Броней: {f.bookingsCount}
                    </span>
                    {canManage && (
                      <EditFormat
                        format={{
                          id: f.id,
                          name: f.name,
                          color: f.color,
                          description: f.description,
                          includes: f.includes,
                          impressions: f.impressions,
                          pricePerImpression: f.pricePerImpression,
                          media: f.media,
                          isActive: f.isActive,
                        }}
                        takenColors={takenColors}
                      />
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}

function Stat({
  label,
  value,
  wide,
}: {
  label: string
  value: string
  wide?: boolean
}) {
  return (
    <div
      className={
        wide ? 'col-span-2 bg-paper/70 px-3 py-2.5' : 'bg-surface px-3 py-2.5'
      }
    >
      <dt className="eyebrow text-ink-muted">{label}</dt>
      <dd
        className={
          wide
            ? 'mt-0.5 font-display text-[17px] font-bold text-ink tnum'
            : 'mt-0.5 text-sm font-semibold text-ink tnum'
        }
      >
        {value}
      </dd>
    </div>
  )
}
