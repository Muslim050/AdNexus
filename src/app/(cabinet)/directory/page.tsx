import type { Metadata } from 'next'
import { BookOpen, Check } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { EditFormat, NewFormat } from '@/components/forms/NewFormat'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { MediaThumb } from '@/components/ui/MediaUpload'
import { requireSection } from '@/lib/auth'
import { listFormats } from '@/lib/data/formats'
import { fileHref } from '@/lib/files'
import { formatSum } from '@/lib/forms'
import { textOn } from '@/lib/palette'

export const metadata: Metadata = { title: 'Справочник' }

const lines = (text: string) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

export default async function Page() {
  const user = await requireSection('/directory')
  const formats = await listFormats()
  const isAdmin = user.role === 'admin'
  const takenColors = formats.map((f) => f.color)
  const create = isAdmin && <NewFormat takenColors={takenColors} />

  return (
    <>
      <PageHeader
        title="Справочник"
        subtitle="Форматы размещений: описание, состав, показы, цена и цвет в календаре."
      >
        {formats.length > 0 && create}
      </PageHeader>

      {formats.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Форматов пока нет"
          description="Добавьте форматы размещений — без них слот в календаре не забронировать."
          action={create}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {formats.map((f) => {
            const cover = f.media[0]
            const included = lines(f.includes)
            const total = f.impressions * Number(f.pricePerImpression)
            return (
              <article
                key={f.id}
                className="flex flex-col border border-line bg-surface"
              >
                {/* Обложка: первое фото или видео; без них — плашка цвета. */}
                <div className="relative aspect-video overflow-hidden bg-forest">
                  {cover ? (
                    <MediaThumb file={cover} />
                  ) : (
                    <div
                      className="flex h-full items-center justify-center bg-hatch"
                      style={{ backgroundColor: `${f.color}1f` }}
                    >
                      <span className="eyebrow text-ink-muted">Нет превью</span>
                    </div>
                  )}
                  <span
                    className="absolute left-0 top-0 max-w-[85%] truncate px-2.5 py-1 text-[12px] font-bold"
                    style={{ background: f.color, color: textOn(f.color) }}
                  >
                    {f.name}
                  </span>
                  {f.media.length > 1 && (
                    <span className="eyebrow absolute bottom-2 right-2 bg-forest/75 px-1.5 py-0.5 text-white">
                      +{f.media.length - 1} {filesWord(f.media.length - 1)}
                    </span>
                  )}
                </div>

                {f.media.length > 1 && (
                  <div className="no-scrollbar flex gap-1.5 overflow-x-auto border-b border-line p-2">
                    {f.media.map((m) => (
                      <a
                        key={m.pathname}
                        href={fileHref(m)}
                        target="_blank"
                        rel="noopener"
                        title={m.name}
                        className="h-12 w-20 shrink-0 overflow-hidden bg-forest focus-ring"
                      >
                        <MediaThumb file={m} />
                      </a>
                    ))}
                  </div>
                )}

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
                    {isAdmin && (
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

function filesWord(n: number) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'файл'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'файла'
  return 'файлов'
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
