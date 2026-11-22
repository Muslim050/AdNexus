'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { campaigns, contracts } from '@/db/schema'
import { requireRole } from '@/lib/auth'
import { dateField, text, type FormState } from '@/lib/forms'

/** Кампания создаётся из договора бренда — как в Setanta. Только admin. */
export async function createCampaign(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const user = await requireRole(['admin'])

  const advertiserId = text(fd, 'advertiserId', 36)
  const contractId = text(fd, 'contractId', 36)
  const name = text(fd, 'name', 300)
  const startDate = dateField(fd, 'startDate')
  const endDate = dateField(fd, 'endDate')

  const errors: Record<string, string> = {}
  if (!advertiserId) errors.advertiserId = 'Выберите рекламодателя'
  if (!contractId) errors.contractId = 'Выберите договор'
  if (!name) errors.name = 'Укажите название кампании'
  if (!startDate) errors.startDate = 'Укажите начало периода'
  if (!endDate) errors.endDate = 'Укажите окончание периода'
  if (startDate && endDate && endDate < startDate) {
    errors.endDate = 'Окончание раньше начала'
  }
  if (Object.keys(errors).length || !startDate || !endDate) {
    return { errors }
  }

  const db = getDb()
  // Договор обязан принадлежать выбранному бренду — проверяем на сервере.
  const [contract] = await db
    .select()
    .from(contracts)
    .where(
      and(
        eq(contracts.id, contractId),
        eq(contracts.advertiserId, advertiserId),
      ),
    )
    .limit(1)
  if (!contract) {
    return {
      errors: { contractId: 'Договор не найден у этого рекламодателя' },
    }
  }

  await db.insert(campaigns).values({
    advertiserId,
    contractId,
    name,
    startDate,
    endDate,
    // Снимок условий договора: его правка не меняет созданные кампании.
    legalName: contract.legalName,
    contractStart: contract.startDate,
    contractEnd: contract.endDate,
    createdBy: user.name,
  })

  revalidatePath('/campaigns')
  return { ok: true, message: `Кампания «${name}» создана` }
}
