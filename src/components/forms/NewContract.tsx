'use client'

import { FileText } from 'lucide-react'
import { createContract } from '@/app/actions/contracts'
import { DatePicker } from '@/components/ui/DatePicker'
import { Field, Input } from '@/components/ui/Field'
import { FileDrop } from '@/components/ui/FileDrop'
import { SelectField } from '@/components/ui/SelectField'
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
      description="Из договора потом создаются заказы и брони слотов."
      icon={FileText}
      action={createContract}
      submitLabel="Добавить договор"
      disabled={advertisers.length === 0}
      disabledHint="Сначала добавьте рекламодателя"
    >
      {({ errors }) => (
        <>
          <Field label="Рекламодатель" required error={errors?.advertiserId}>
            <SelectField
              name="advertiserId"
              placeholder="Выберите бренд"
              invalid={!!errors?.advertiserId}
              options={advertisers.map((a) => ({
                value: a.id,
                label: a.name,
                hint: a.legalName || undefined,
              }))}
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
            <Field
              label="Номер договора"
              required
              hint="Уникален по всей базе."
              error={errors?.number}
            >
              <Input name="number" />
            </Field>
            <Field label="Скидка, %" error={errors?.discount}>
              <Input
                name="discount"
                inputMode="decimal"
                placeholder="0"
                aria-invalid={!!errors?.discount || undefined}
              />
            </Field>
          </div>
          <Field
            label="Рекламная кампания"
            hint="Под какую кампанию заключён договор — подставится в заказ и бронь."
            error={errors?.campaignName}
          >
            <Input name="campaignName" />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Начало" error={errors?.startDate}>
              <DatePicker
                name="startDate"
                clearable
                invalid={!!errors?.startDate}
              />
            </Field>
            <Field label="Окончание" error={errors?.endDate}>
              <DatePicker
                name="endDate"
                clearable
                invalid={!!errors?.endDate}
              />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Сроки оплаты" error={errors?.paymentDate}>
              <DatePicker
                name="paymentDate"
                clearable
                invalid={!!errors?.paymentDate}
              />
            </Field>
            <Field label="Статус договора" error={errors?.status}>
              <SelectField
                name="status"
                defaultValue="active"
                options={Object.entries(CONTRACT_STATUS).map(([value, s]) => ({
                  value,
                  label: s.label,
                }))}
              />
            </Field>
          </div>
          <Field group label="Файл договора" error={errors?.file}>
            <FileDrop name="file" folder="contracts" />
          </Field>
        </>
      )}
    </CreateDrawer>
  )
}
