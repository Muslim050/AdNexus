'use client'

import { useState } from 'react'
import { DatePicker } from '@/components/ui/DatePicker'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { FileDrop, FileLink } from '@/components/ui/FileDrop'
import { SelectField } from '@/components/ui/SelectField'
import { TimePicker } from '@/components/ui/TimePicker'
import type { ContractStatus } from '@/db/schema'
import type { AdvertiserStatus } from '@/lib/advertisers'
import { BOOKING_STATUS, type BookingStatus } from '@/lib/bookings'
import { CONTRACT_STATUS } from '@/lib/contracts'
import { useNow } from '@/lib/useNow'
import { formatPeriod } from '@/lib/dates'
import type { AttachedFile } from '@/lib/files'
import { formatPercent, formatSum, type FormState } from '@/lib/forms'
import { suggestedAmount } from '@/lib/pricing'
import { ROLE_INFO, type Role } from '@/lib/roles'

export interface FormatChoice {
  id: string
  name: string
  color: string
  isActive: boolean
  impressions: number
  pricePerImpression: string
}

export interface ManagerChoice {
  id: string
  name: string
  role: Role
}

export interface AdvertiserChoice {
  id: string
  name: string
  status: AdvertiserStatus
  creativeRequired: boolean
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

/** Значения брони при правке. */
export interface BookingInitial {
  id: string
  status: BookingStatus
  amount: string
  managerId: string | null
  formatId: string
  advertiserId: string | null
  contractId: string | null
  campaignName: string
  comment: string
  file: AttachedFile | null
  /** Чтобы прежний менеджер остался в списке, даже если его там уже нет. */
  managerName?: string | null
}

interface Props {
  /** Сотрудник выбирает статус, менеджера и бренд; рекламодатель — только своё. */
  role: 'staff' | 'advertiser'
  /** Правка существующей брони — поля заполнены её значениями. */
  initial?: BookingInitial
  state: FormState
  date: string
  time: string
  /** Формат новой брони, если её начали из его группы. */
  presetFormatId?: string
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
  role,
  initial,
  state,
  date,
  time,
  presetFormatId = '',
  formats,
  managers,
  advertisers,
  contracts,
  currentUserId,
}: Props) {
  const { errors } = state
  const isAdvertiser = role === 'advertiser'
  // Рекламодателю бренд не выбирать — он у него один, из учётной записи.
  const [advertiserId, setAdvertiserId] = useState(
    initial?.advertiserId ?? (isAdvertiser ? (advertisers[0]?.id ?? '') : ''),
  )
  // Единственный договор бренда выбираем сразу — и у рекламодателя тоже.
  const soleContract = (() => {
    const own = contracts.filter((c) => c.advertiserId === advertiserId)
    return own.length === 1 ? own[0] : undefined
  })()
  const [contractId, setContractId] = useState(
    initial?.contractId ?? soleContract?.id ?? '',
  )
  const [campaignName, setCampaignName] = useState(
    initial?.campaignName ?? soleContract?.campaignName ?? '',
  )
  const [formatId, setFormatId] = useState(initial?.formatId ?? presetFormatId)
  const [when, setWhen] = useState({ date, time })
  // Сумму подставляем расчётом, пока её не ввели руками.
  const [amount, setAmount] = useState(
    initial && Number(initial.amount) ? String(Number(initial.amount)) : '',
  )
  const [amountTouched, setAmountTouched] = useState(
    Boolean(initial && Number(initial.amount)),
  )

  // Только действующие бренды с договорами: без договора слот не забронировать.
  // Отключённый остаётся в списке у брони, которая за ним стоит.
  const withContracts = advertisers.filter(
    (a) =>
      (a.status === 'active' || a.id === initial?.advertiserId) &&
      contracts.some((c) => c.advertiserId === a.id),
  )
  // Ролик обязателен для новой брони бренда; у старой брони без файла — нет.
  const brand = advertisers.find((a) => a.id === advertiserId)
  const fileRequired =
    !!brand?.creativeRequired &&
    (!initial || !!initial.file || initial.advertiserId !== advertiserId)
  const brandContracts = contracts.filter(
    (c) => c.advertiserId === advertiserId,
  )
  const contract = contracts.find((c) => c.id === contractId)
  const format = formats.find((f) => f.id === formatId)
  const suggestion = suggestedAmount(format, contract?.discount)
  const shownAmount = amountTouched
    ? amount
    : suggestion
      ? String(suggestion)
      : ''

  // Предупреждения: сохранить можно, но лучше проверить. Рекламодателю
  // сервер такое не пропустит — подсказка объясняет почему заранее.
  const now = useNow()
  const moved = !initial || when.date !== date || when.time !== time
  const inPast =
    moved &&
    now != null &&
    `${when.date} ${when.time}` < `${now.date} ${now.time}`
  const outOfTerm =
    contract &&
    ((contract.startDate && when.date < contract.startDate) ||
      (contract.endDate && when.date > contract.endDate))
  const contractWarning = !contract
    ? undefined
    : contract.status !== 'active'
      ? `Договор ${CONTRACT_STATUS[contract.status].label.toLowerCase()}.`
      : outOfTerm
        ? `Дата публикации вне срока договора: ${formatPeriod(contract.startDate, contract.endDate)}.`
        : undefined

  // Менеджер брони, которого больше нет в списке, остаётся выбранным.
  const managerOptions = managers.map((m) => ({
    value: m.id,
    label: m.name,
    hint: ROLE_INFO[m.role].label,
  }))
  if (initial?.managerId && !managers.some((m) => m.id === initial.managerId)) {
    managerOptions.push({
      value: initial.managerId,
      label: initial.managerName ?? 'Прежний менеджер',
      hint: 'Не ведёт брони — лучше выбрать другого',
    })
  }

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
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
        <Field
          label="Дата"
          required
          error={errors?.date}
          warning={
            inPast
              ? isAdvertiser
                ? 'Это время уже прошло — выберите другое.'
                : 'Это время уже прошло: бронь будет задним числом.'
              : undefined
          }
        >
          <DatePicker
            name="date"
            value={when.date}
            onChange={(d) => setWhen((w) => ({ ...w, date: d }))}
          />
        </Field>
        <Field label="Время" required error={errors?.time}>
          <TimePicker
            name="time"
            defaultValue={time}
            onChange={(t) => setWhen((w) => ({ ...w, time: t }))}
          />
        </Field>
      </div>

      {!isAdvertiser && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Статус">
            <SelectField
              name="status"
              defaultValue={initial?.status ?? 'sent'}
              options={Object.entries(BOOKING_STATUS).map(([value, s]) => ({
                value,
                label: s.label,
              }))}
            />
          </Field>
          <Field label="Менеджер" required error={errors?.managerId}>
            <SelectField
              name="managerId"
              placeholder="Выберите сотрудника"
              defaultValue={
                initial
                  ? (initial.managerId ?? '')
                  : managers.some((m) => m.id === currentUserId)
                    ? currentUserId
                    : ''
              }
              options={managerOptions}
            />
          </Field>
        </div>
      )}

      <Field label="Формат публикации" required error={errors?.formatId}>
        <SelectField
          name="formatId"
          placeholder="Выберите формат"
          value={formatId}
          onChange={setFormatId}
          options={formats
            // Отключённый формат остаётся в списке у брони, которая на нём стоит.
            .filter((f) => f.isActive || f.id === initial?.formatId)
            .map((f) => ({ value: f.id, label: f.name, color: f.color }))}
        />
      </Field>

      {isAdvertiser ? (
        <Field label="Рекламодатель" error={errors?.advertiserId}>
          <p className="flex h-11 items-center border border-line bg-paper/70 px-3.5 text-sm font-semibold text-ink">
            {advertisers[0]?.name ?? 'Бренд не привязан'}
          </p>
        </Field>
      ) : (
        <Field label="Рекламодатель" required error={errors?.advertiserId}>
          <SelectField
            name="advertiserId"
            placeholder="Выберите рекламодателя"
            value={advertiserId}
            onChange={pickAdvertiser}
            emptyText="Нет рекламодателей с договорами"
            options={withContracts.map((a) => ({ value: a.id, label: a.name }))}
          />
        </Field>
      )}

      <Field
        label="Договор"
        required
        hint={!advertiserId ? 'Сначала выберите рекламодателя.' : undefined}
        warning={contractWarning}
        error={errors?.contractId}
      >
        <SelectField
          name="contractId"
          placeholder="Выберите договор"
          value={contractId}
          onChange={pickContract}
          disabled={!advertiserId}
          emptyText="Договоров пока нет"
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
        />
      </Field>

      {/* Сумма: admin вводит или берёт расчёт; рекламодателю — расчёт. */}
      {isAdvertiser ? (
        <div className="flex items-center justify-between border border-line bg-paper/70 px-4 py-3">
          <span>
            <span className="eyebrow block text-ink-muted">Сумма</span>
            <span className="text-xs text-ink-muted">
              Пакет формата за вычетом скидки по договору
            </span>
          </span>
          <span className="font-display text-lg font-bold text-ink tnum">
            {formatSum(suggestion)}
          </span>
        </div>
      ) : (
        <Field
          label="Сумма, сум"
          error={errors?.amount}
          hint={
            format && suggestion
              ? `По пакету: ${formatSum(format.impressions * Number(format.pricePerImpression))}${
                  Number(contract?.discount)
                    ? ` − ${formatPercent(contract?.discount)} = ${formatSum(suggestion)}`
                    : ''
                }`
              : 'Пакет формата минус скидка по договору — подставится автоматически.'
          }
        >
          <div className="flex gap-2">
            <MoneyInput
              name="amount"
              value={shownAmount}
              onChange={(plain) => {
                setAmountTouched(true)
                setAmount(plain)
              }}
            />
            {amountTouched &&
              suggestion > 0 &&
              Number(amount) !== suggestion && (
                <button
                  type="button"
                  onClick={() => {
                    setAmountTouched(false)
                    setAmount('')
                  }}
                  className="h-11 shrink-0 border border-ink/20 px-3 text-[13px] font-semibold text-ink-soft transition-colors hover:border-ink hover:text-ink focus-ring"
                >
                  По расчёту
                </button>
              )}
          </div>
        </Field>
      )}

      <Field
        group
        label={fileRequired ? 'Рекламный ролик' : 'Файл'}
        required={fileRequired}
        hint={
          fileRequired
            ? 'Для этого рекламодателя ролик обязателен.'
            : 'Креатив, ТЗ или другие материалы слота.'
        }
        error={errors?.file}
      >
        <FileDrop
          name="file"
          folder="bookings"
          defaultValue={initial?.file ?? null}
        />
      </Field>

      <Field label="Комментарий" error={errors?.comment}>
        <Textarea name="comment" rows={3} defaultValue={initial?.comment} />
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
