'use server'

import { revalidatePath } from 'next/cache'
import { getDb } from '@/db'
import { advertisers } from '@/db/schema'
import { requireRole } from '@/lib/auth'
import { isEmail, text, type FormState } from '@/lib/forms'

export async function createAdvertiser(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireRole(['admin'])

  const name = text(fd, 'name', 200)
  const legalName = text(fd, 'legalName', 300)
  const contact = text(fd, 'contact', 200)
  const email = text(fd, 'email', 200).toLowerCase()

  const errors: Record<string, string> = {}
  if (!name) errors.name = 'Укажите название бренда'
  if (email && !isEmail(email)) errors.email = 'Проверьте адрес почты'
  if (Object.keys(errors).length) return { errors }

  await getDb().insert(advertisers).values({ name, legalName, contact, email })
  revalidatePath('/advertisers')
  return { ok: true, message: `Рекламодатель ${name} добавлен` }
}
