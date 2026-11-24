'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { del } from '@vercel/blob'
import { getDb } from '@/db'
import { advertisers } from '@/db/schema'
import { isAdvertiserStatus, isBrandColor } from '@/lib/advertisers'
import { requireRole } from '@/lib/auth'
import { parseAttachedFile } from '@/lib/files'
import { isEmail, text, type FormState } from '@/lib/forms'
import { EDITORS } from '@/lib/roles'

/** Поля рекламодателя из формы — общие для создания и правки. */
function readAdvertiser(fd: FormData) {
  const status = text(fd, 'status', 20)
  const color = text(fd, 'color', 7)
  const logo = parseAttachedFile(fd.get('logo'), 'logos')
  const values = {
    name: text(fd, 'name', 200),
    legalName: text(fd, 'legalName', 300),
    contact: text(fd, 'contact', 200),
    email: text(fd, 'email', 200).toLowerCase(),
    requisites: text(fd, 'requisites', 4000),
    creativeRequired: fd.get('creativeRequired') === 'on',
  }

  const errors: Record<string, string> = {}
  if (!values.name) errors.name = 'Укажите название бренда'
  if (values.email && !isEmail(values.email)) {
    errors.email = 'Проверьте адрес почты'
  }
  if (!isAdvertiserStatus(status)) errors.status = 'Выберите статус'
  if (!isBrandColor(color)) errors.color = 'Выберите цвет'
  if (logo && !logo.contentType.startsWith('image/')) {
    errors.logo = 'Логотип — только картинка'
  }
  if (Object.keys(errors).length || !isAdvertiserStatus(status)) {
    return { ok: false as const, errors }
  }
  return { ok: true as const, values: { ...values, status, color, logo } }
}

function refresh() {
  revalidatePath('/advertisers')
  revalidatePath('/advertisers/contracts')
  revalidatePath('/calendar')
  revalidatePath('/orders')
}

export async function createAdvertiser(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireRole(EDITORS)
  const read = readAdvertiser(fd)
  if (!read.ok) return { errors: read.errors }

  await getDb().insert(advertisers).values(read.values)
  refresh()
  return { ok: true, message: `Рекламодатель ${read.values.name} добавлен` }
}

/** Правка рекламодателя; заменённый логотип удаляем из Blob. */
export async function updateAdvertiser(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireRole(EDITORS)
  const id = text(fd, 'id', 36)
  const read = readAdvertiser(fd)
  if (!read.ok) return { errors: read.errors }

  const db = getDb()
  const [existing] = await db
    .select({ logo: advertisers.logo })
    .from(advertisers)
    .where(eq(advertisers.id, id))
    .limit(1)
  if (!existing) return { error: 'Рекламодатель не найден' }

  await db.update(advertisers).set(read.values).where(eq(advertisers.id, id))

  if (existing.logo && existing.logo.pathname !== read.values.logo?.pathname) {
    try {
      await del(existing.logo.pathname)
    } catch (err) {
      console.error('Не удалось удалить логотип из Blob', err)
    }
  }
  refresh()
  return { ok: true, message: `Рекламодатель ${read.values.name} сохранён` }
}
