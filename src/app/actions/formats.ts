'use server'

import { revalidatePath } from 'next/cache'
import { max } from 'drizzle-orm'
import { getDb } from '@/db'
import { placementFormats } from '@/db/schema'
import { requireRole } from '@/lib/auth'
import { isUniqueViolation, text, type FormState } from '@/lib/forms'
import { isPaletteColor } from '@/lib/palette'

export async function createFormat(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireRole(['admin'])

  const name = text(fd, 'name', 120)
  const color = text(fd, 'color', 7)

  const errors: Record<string, string> = {}
  if (!name) errors.name = 'Укажите название формата'
  if (!isPaletteColor(color)) errors.color = 'Выберите цвет'
  if (Object.keys(errors).length) return { errors }

  const db = getDb()
  const [{ last }] = await db
    .select({ last: max(placementFormats.position) })
    .from(placementFormats)

  try {
    await db
      .insert(placementFormats)
      .values({ name, color, position: (last ?? 0) + 1 })
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { errors: { name: 'Такой формат уже есть' } }
    }
    throw err
  }

  revalidatePath('/directory')
  revalidatePath('/calendar')
  return { ok: true, message: `Формат «${name}» добавлен` }
}
