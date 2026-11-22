'use client'

import { FileText } from 'lucide-react'
import { createContract } from '@/app/actions/contracts'
import { Field, Input, Select } from '@/components/ui/Field'
import { CONTRACT_STATUS } from '@/lib/contracts'
import { CreateDrawer } from './CreateDrawer'

interface AdvertiserOption {
  id: string
  name: string
  legalName: string
}

export function NewContract({
  advertisers,
}: {
  advertisers: AdvertiserOption[]
}) {
  return (
    <CreateDrawer
      label="Добавить договор"
      title="Новый договор"
      description="Из договора потом создаются кампании бренда."
      icon={FileText}
      action={createContract}
      submitLabel="Добавить договор"
      disabled={advertisers.length === 0}
      disabledHint="Сначала добавьте рекламодателя"
    >
      {({ errors }) => (
        <>
          <Field label="Рекламодатель" required error={errors?.advertiserId}>
            <Select name="advertiserId" defaultValue="">
              <option value="" disabled>
                Выберите бренд
              </option>
              {advertisers.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Номер договора"
            required
            hint="Уникален по всей базе."
            error={errors?.number}
          >
            <Input name="number" />
          </Field>
          <Field
            label="Рекламная кампания"
            hint="Под какую кампанию заключён договор — подставится в форму кампании."
            error={errors?.campaignName}
          >
            <Input name="campaignName" />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Начало" error={errors?.startDate}>
              <Input name="startDate" type="date" />
            </Field>
            <Field label="Окончание" error={errors?.endDate}>
              <Input name="endDate" type="date" />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Сроки оплаты" error={errors?.paymentDate}>
              <Input name="paymentDate" type="date" />
            </Field>
            <Field label="Статус договора" error={errors?.status}>
              <Select name="status" defaultValue="active">
                {Object.entries(CONTRACT_STATUS).map(([value, s]) => (
                  <option key={value} value={value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </>
      )}
    </CreateDrawer>
  )
}
