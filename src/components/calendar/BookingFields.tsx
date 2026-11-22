'use client'

import { useState } from 'react'
import { DatePicker } from '@/components/ui/DatePicker'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { FileDrop, FileLink } from '@/components/ui/FileDrop'
import { SelectField } from '@/components/ui/SelectField'
import { TimePicker } from '@/components/ui/TimePicker'
import { CONTRACT_STATUS } from '@/lib/contracts'
import { formatPeriod } from '@/lib/dates'
import type { AttachedFile } from '@/lib/files'
import { formatPercent, type FormState } from '@/lib/forms'
import type { ContractStatus } from '@/db/schema'

export interface FormatChoice {
  id: string
  name: string
  color: string
  isActive: boolean
}

export interface ManagerChoice {
  id: string
  name: string
  role: string
}

export interface AdvertiserChoice {
  id: string
  name: string
}

export interface ContractChoice {
  id: string
  advertiserId: string
  number: string
  campaignName: string
  startDate: string | null
  endDate: string | null
  status: ContractStatus
  discount: string
  file: AttachedFile | null
}

interface Props {
  state: FormState
  date: string
  time: string
  formats: FormatChoice[]
  managers: ManagerChoice[]
  advertisers: AdvertiserChoice[]
  contracts: ContractChoice[]
  currentUserId: string
}

/**
 * Поля брони. Порядок: когда → кто → что → для кого. Из договора
 * подтягиваются номер, скидка, срок, файл и название кампании.
 */
export function BookingFields({
  state,
  date,
  time,
  formats,
  managers,
  advertisers,
  contracts,
  currentUserId,
}: Props) {
  const { errors } = state
  const [advertiserId, setAdvertiserId] = useState('')
  const [contractId, setContractId] = useState('')
  const [campaignName, setCampaignName] = useState('')

  // Только бренды с договорами: без договора слот не забронировать.
  const withContracts = advertisers.filter((a) =>
    contracts.some((c) => c.advertiserId === a.id),
  )
  const brandContracts = contracts.filter(
    (c) => c.advertiserId === advertiserId,
  )
  const contract = contracts.find((c) => c.id === contractId)

  const pickContract = (id: string) => {
    const next = contracts.find((c) => c.id === id)
    // Название кампании — из договора, если его не меняли руками.
    if (!campaignName.trim() || campaignName === contract?.campaignName) {
      setCampaignName(next?.campaignName ?? '')
    }
    setContractId(id)
  }

  const pickAdvertiser = (id: string) => {
    setAdvertiserId(id)
    const own = contracts.filter((c) => c.advertiserId === id)
    // Единственный договор бренда выбираем сами.
    pickContract(own.length === 1 ? own[0].id : '')
  }

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
        <Field label="Дата" required error={errors?.date}>
          <DatePicker
            name="date"
            defaultValue={date}
            invalid={!!errors?.date}
          />
        </Field>
        <Field label="Время" required error={errors?.time}>
          <TimePicker
            name="time"
            defaultValue={time}
            invalid={!!errors?.time}
          />
        </Field>
      </div>

      <Field label="Менеджер" required error={errors?.managerId}>
        <SelectField
          name="managerId"
          placeholder="Выберите сотрудника"
          defaultValue={
            managers.some((m) => m.id === currentUserId) ? currentUserId : ''
          }
          invalid={!!errors?.managerId}
          options={managers.map((m) => ({
            value: m.id,
            label: m.name,
            hint: m.role === 'admin' ? 'Администратор' : 'Сотрудник',
          }))}
        />
      </Field>

      <Field label="Формат размещения" required error={errors?.formatId}>
        <SelectField
          name="formatId"
          placeholder="Выберите формат"
          invalid={!!errors?.formatId}
          options={formats
            .filter((f) => f.isActive)
            .map((f) => ({ value: f.id, label: f.name, color: f.color }))}
        />
      </Field>

      <Field label="Рекламодатель" required error={errors?.advertiserId}>
        <SelectField
          name="advertiserId"
          placeholder="Выберите рекламодателя"
          value={advertiserId}
          onChange={pickAdvertiser}
          invalid={!!errors?.advertiserId}
          emptyText="Нет рекламодателей с договорами"
          options={withContracts.map((a) => ({ value: a.id, label: a.name }))}
        />
      </Field>

      <Field
        label="Договор"
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

      {/* Что подтянулось из договора. */}
      {contract && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border border-line bg-paper/70 px-4 py-3.5">
          <Info label="Номер договора" value={`№ ${contract.number}`} mono />
          <Info label="Скидка" value={formatPercent(contract.discount)} />
          <Info
            label="Срок договора"
            value={formatPeriod(contract.startDate, contract.endDate)}
            wide
          />
          <div className="col-span-2 min-w-0">
            <dt className="eyebrow text-ink-muted">Файл договора</dt>
            <dd className="mt-1">
              {contract.file ? (
                <FileLink file={contract.file} />
              ) : (
                <span className="text-sm text-ink-muted">Не приложен</span>
              )}
            </dd>
          </div>
        </dl>
      )}

      <Field
        label="Рекламная кампания"
        required
        hint={
          contract?.campaignName
            ? `В договоре указана: ${contract.campaignName}`
            : 'Покажется в слоте после формата.'
        }
        error={errors?.campaignName}
      >
        <Input
          name="campaignName"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          aria-invalid={!!errors?.campaignName || undefined}
        />
      </Field>

      <Field label="Файл" hint="Креатив, ТЗ или другие материалы слота.">
        <FileDrop name="file" folder="bookings" />
      </Field>

      <Field label="Комментарий" error={errors?.comment}>
        <Textarea name="comment" rows={3} />
      </Field>
    </>
  )
}

function Info({
  label,
  value,
  mono,
  wide,
}: {
  label: string
  value: string
  mono?: boolean
  wide?: boolean
}) {
  return (
    <div className={wide ? 'col-span-2' : undefined}>
      <dt className="eyebrow text-ink-muted">{label}</dt>
      <dd
        className={
          mono
            ? 'mt-1 font-mono text-[13px] font-semibold text-ink'
            : 'mt-1 text-sm font-semibold text-ink tnum'
        }
      >
        {value}
      </dd>
    </div>
  )
}
