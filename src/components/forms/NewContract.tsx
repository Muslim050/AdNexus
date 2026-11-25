'use client'

import { FileText, Pencil } from 'lucide-react'
import { createContract, updateContract } from '@/app/actions/contracts'
import { DatePicker } from '@/components/ui/DatePicker'
import { Field, Input } from '@/components/ui/Field'
import { FileDrop } from '@/components/ui/FileDrop'
import { SelectField } from '@/components/ui/SelectField'
import type { ContractStatus } from '@/db/schema'
import { CONTRACT_STATUS } from '@/lib/contracts'
import type { AttachedFile } from '@/lib/files'
import type { FormState } from '@/lib/forms'
import { CreateDrawer, FormDrawer } from './CreateDrawer'

interface AdvertiserOption {
  id: string
  name: string
  legalName: string
}

export interface ContractInitial {
  id: string
  advertiserId: string
  advertiserName: string
  number: string
  campaignName: string
  startDate: string | null
  endDate: string | null
  paymentDate: string | null
  status: ContractStatus
  discount: string
  file: AttachedFile | null
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
      {(state) => <ContractFields state={state} advertisers={advertisers} />}
    </CreateDrawer>
  )
}

/** Правка договора; открытием управляет карточка договора. */
export function EditContractDrawer({
  contract,
  open,
  onClose,
  round,
}: {
  contract: ContractInitial
  open: boolean
  onClose: () => void
  round: number
}) {
  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      round={round}
      title={`Изменить договор № ${contract.number}`}
      description={contract.advertiserName}
      icon={Pencil}
      action={updateContract}
      submitLabel="Сохранить"
    >
      {(state) => <ContractFields state={state} initial={contract} />}
    </FormDrawer>
  )
}

function ContractFields({
  state: { errors },
  advertisers = [],
  initial,
}: {
  state: FormState
  advertisers?: AdvertiserOption[]
  initial?: ContractInitial
}) {
  // Скидка «12.50» из базы — в поле как «12,5».
  const discount =
    initial && Number(initial.discount)
      ? String(Number(initial.discount)).replace('.', ',')
      : ''
  return (
    <>
      {initial ? (
        // К договору привязаны брони — бренд у него не меняется.
        <Field
          label="Рекламодатель"
          hint="Бренд договора не меняется: к нему привязаны брони."
          error={errors?.advertiserId}
        >
          <input
            type="hidden"
            name="advertiserId"
            value={initial.advertiserId}
          />
          <input type="hidden" name="id" value={initial.id} />
          <p className="flex h-11 items-center border border-line bg-paper/70 px-3.5 text-sm font-semibold text-ink">
            {initial.advertiserName}
          </p>
        </Field>
      ) : (
        <Field label="Рекламодатель" required error={errors?.advertiserId}>
          <SelectField
            name="advertiserId"
            placeholder="Выберите бренд"
            options={advertisers.map((a) => ({
              value: a.id,
              label: a.name,
              hint: a.legalName || undefined,
            }))}
          />
        </Field>
      )}
      <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
        <Field
          label="Номер договора"
          required
          hint="Уникален по всей базе."
          error={errors?.number}
        >
          <Input name="number" defaultValue={initial?.number} />
        </Field>
        <Field
          label="Скидка, %"
          hint={initial ? 'Для новых броней.' : undefined}
          error={errors?.discount}
        >
          <Input
            name="discount"
            inputMode="decimal"
            placeholder="0"
            defaultValue={discount}
          />
        </Field>
      </div>
      <Field
        label="Рекламная кампания"
        hint="Под какую кампанию заключён договор — подставится в заказ и бронь."
        error={errors?.campaignName}
      >
        <Input name="campaignName" defaultValue={initial?.campaignName} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Начало" error={errors?.startDate}>
          <DatePicker
            name="startDate"
            defaultValue={initial?.startDate ?? ''}
            clearable
          />
        </Field>
        <Field label="Окончание" error={errors?.endDate}>
          <DatePicker
            name="endDate"
            defaultValue={initial?.endDate ?? ''}
            clearable
          />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Сроки оплаты" error={errors?.paymentDate}>
          <DatePicker
            name="paymentDate"
            defaultValue={initial?.paymentDate ?? ''}
            clearable
          />
        </Field>
        <Field label="Статус договора" error={errors?.status}>
          <SelectField
            name="status"
            defaultValue={initial?.status ?? 'active'}
            options={Object.entries(CONTRACT_STATUS).map(([value, s]) => ({
              value,
              label: s.label,
            }))}
          />
        </Field>
      </div>
      <Field group label="Файл договора" error={errors?.file}>
        <FileDrop
          name="file"
          folder="contracts"
          defaultValue={initial?.file ?? null}
        />
      </Field>
    </>
  )
}
