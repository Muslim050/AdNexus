'use client'

import { useState } from 'react'
import { Megaphone } from 'lucide-react'
import { createCampaign } from '@/app/actions/campaigns'
import { DatePicker } from '@/components/ui/DatePicker'
import { Field, Input } from '@/components/ui/Field'
import { SelectField } from '@/components/ui/SelectField'
import { CONTRACT_STATUS } from '@/lib/contracts'
import { formatPeriod } from '@/lib/dates'
import type { ContractStatus } from '@/db/schema'
import type { FormState } from '@/lib/forms'
import { CreateDrawer } from './CreateDrawer'

interface AdvertiserOption {
  id: string
  name: string
}

interface ContractOption {
  id: string
  advertiserId: string
  number: string
  campaignName: string
  startDate: string | null
  endDate: string | null
  status: ContractStatus
}

interface Props {
  advertisers: AdvertiserOption[]
  contracts: ContractOption[]
}

/**
 * Кампания из договора — как в Setanta: выбираем бренд, затем его договор;
 * из договора подставляются название кампании и срок договора.
 */
export function NewCampaign({ advertisers, contracts }: Props) {
  return (
    <CreateDrawer
      label="Создать заказ"
      title="Новый заказ"
      description="Заказ оформляется по договору рекламодателя."
      icon={Megaphone}
      action={createCampaign}
      submitLabel="Создать заказ"
      disabled={contracts.length === 0}
      disabledHint="Сначала добавьте договор рекламодателю"
    >
      {(state) => (
        <CampaignFields
          state={state}
          advertisers={advertisers}
          contracts={contracts}
        />
      )}
    </CreateDrawer>
  )
}

function CampaignFields({
  state,
  advertisers,
  contracts,
}: Props & { state: FormState }) {
  const { errors } = state
  // Поля связаны между собой: выбор бренда фильтрует договоры, договор
  // подставляет название и границы дат.
  const [advertiserId, setAdvertiserId] = useState('')
  const [contractId, setContractId] = useState('')
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Только бренды, у которых есть договоры: без договора кампанию не создать.
  const withContracts = advertisers.filter((a) =>
    contracts.some((c) => c.advertiserId === a.id),
  )
  const brandContracts = contracts.filter(
    (c) => c.advertiserId === advertiserId,
  )
  const contract = contracts.find((c) => c.id === contractId)

  const pickAdvertiser = (id: string) => {
    setAdvertiserId(id)
    const own = contracts.filter((c) => c.advertiserId === id)
    // Единственный договор выбираем сами — меньше кликов.
    pickContract(own.length === 1 ? own[0].id : '')
  }

  const pickContract = (id: string) => {
    const next = contracts.find((c) => c.id === id)
    // Название подставляем, если поле пустое или в нём название прошлого договора.
    if (!name.trim() || name === contract?.campaignName) {
      setName(next?.campaignName ?? '')
    }
    setContractId(id)
  }

  return (
    <>
      <Field label="Рекламодатель" required error={errors?.advertiserId}>
        <SelectField
          name="advertiserId"
          placeholder="Выберите бренд"
          value={advertiserId}
          onChange={pickAdvertiser}
          invalid={!!errors?.advertiserId}
          emptyText="Нет рекламодателей с договорами"
          options={withContracts.map((a) => ({ value: a.id, label: a.name }))}
        />
      </Field>

      <Field
        label="Номер договора"
        required
        hint={!advertiserId ? 'Сначала выберите рекламодателя.' : undefined}
        error={errors?.contractId}
      >
        <SelectField
          name="contractId"
          placeholder="Выберите договор"
          value={contractId}
          onChange={pickContract}
          disabled={!advertiserId}
          invalid={!!errors?.contractId}
          options={brandContracts.map((c) => ({
            value: c.id,
            label: `№ ${c.number}`,
            hint: [
              c.campaignName,
              c.status !== 'active' ? CONTRACT_STATUS[c.status].label : '',
            ]
              .filter(Boolean)
              .join(' · '),
          }))}
        />
      </Field>

      <Field
        label="Рекламная кампания"
        required
        hint={
          contract?.campaignName
            ? `В договоре указана: ${contract.campaignName}`
            : undefined
        }
        error={errors?.name}
      >
        <Input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      {contract && (
        <div className="border border-line bg-paper/70 px-4 py-3">
          <p className="eyebrow text-ink-muted">Срок договора</p>
          <p className="mt-1 text-sm font-semibold text-ink tnum">
            {formatPeriod(contract.startDate, contract.endDate)}
          </p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Начало периода" required error={errors?.startDate}>
          <DatePicker
            name="startDate"
            value={startDate}
            onChange={setStartDate}
            min={contract?.startDate}
            max={contract?.endDate}
            invalid={!!errors?.startDate}
          />
        </Field>
        <Field label="Окончание периода" required error={errors?.endDate}>
          <DatePicker
            name="endDate"
            value={endDate}
            onChange={setEndDate}
            min={startDate || contract?.startDate}
            max={contract?.endDate}
            invalid={!!errors?.endDate}
          />
        </Field>
      </div>
    </>
  )
}
