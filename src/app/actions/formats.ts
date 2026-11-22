'use server'

import { revalidatePath } from 'next/cache'
import { eq, max } from 'drizzle-orm'
import { del } from '@vercel/blob'
import { getDb } from '@/db'
import { placementFormats } from '@/db/schema'
import { requireRole } from '@/lib/auth'
import { parseAttachedFiles } from '@/lib/files'
import {
  isUniqueViolation,
  numberField,
  text,
  type FormState,
} from '@/lib/forms'
import { isPaletteColor } from '@/lib/palette'

/** Поля формата из формы — общие для создания и правки. */
function readFormat(fd: FormData) {
  const values = {
    name: text(fd, 'name', 120),
    color: text(fd, 'color', 7),
    description: text(fd, 'description', 2000),
    includes: text(fd, 'includes', 4000),
    media: parseAttachedFiles(fd.get('media'), 'formats', 10),
  }
  const impressions = numberField(fd, 'impressions', { integer: true })
  const price = numberField(fd, 'pricePerImpression', { max: 1e10 })

  const errors: Record<string, string> = {}
  if (!values.name) errors.name = 'Укажите название формата'
  if (!isPaletteColor(values.color)) errors.color = 'Выберите цвет'
  if (impressions === false) errors.impressions = 'Целое число показов'
  if (price === false) errors.pricePerImpression = 'Сумма — число, например 150'
  if (Object.keys(errors).length || impressions === false || price === false) {
    return { ok: false as const, errors }
  }
  return {
    ok: true as const,
    values: {
      ...values,
      impressions,
      pricePerImpression: price.toFixed(2),
    },
  }
}

function refresh() {
  revalidatePath('/directory')
  revalidatePath('/calendar')
}

export async function createFormat(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireRole(['admin'])
  const read = readFormat(fd)
  if (!read.ok) return { errors: read.errors }

  const db = getDb()
  const [{ last }] = await db
    .select({ last: max(placementFormats.position) })
    .from(placementFormats)

  try {
    await db
      .insert(placementFormats)
      .values({ ...read.values, position: (last ?? 0) + 1 })
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { errors: { name: 'Такой формат уже есть' } }
    }
    throw err
  }

  refresh()
  return { ok: true, message: `Формат «${read.values.name}» добавлен` }
}

/** Правка формата. Убранные из превью файлы удаляем из Blob. */
export async function updateFormat(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireRole(['admin'])
  const id = text(fd, 'id', 36)
  const read = readFormat(fd)
  if (!read.ok) return { errors: read.errors }

  const db = getDb()
  const [existing] = await db
    .select({ media: placementFormats.media })
    .from(placementFormats)
    .where(eq(placementFormats.id, id))
    .limit(1)
  if (!existing) return { error: 'Формат не найден' }

  try {
    await db
      .update(placementFormats)
      .set({ ...read.values, isActive: fd.get('isActive') === 'on' })
      .where(eq(placementFormats.id, id))
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { errors: { name: 'Такой формат уже есть' } }
    }
    throw err
  }

  const kept = new Set(read.values.media.map((f) => f.pathname))
  const removed = existing.media
    .map((f) => f.pathname)
    .filter((p) => !kept.has(p))
  if (removed.length) {
    try {
      await del(removed)
    } catch (err) {
      console.error('Не удалось удалить превью из Blob', removed, err)
    }
  }

  refresh()
  return { ok: true, message: `Формат «${read.values.name}» сохранён` }
}
