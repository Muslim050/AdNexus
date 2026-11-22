'use client'

import { Building2 } from 'lucide-react'
import { createAdvertiser } from '@/app/actions/advertisers'
import { Field, Input } from '@/components/ui/Field'
import { CreateDrawer } from './CreateDrawer'

export function NewAdvertiser() {
  return (
    <CreateDrawer
      label="Добавить рекламодателя"
      title="Новый рекламодатель"
      description="Бренд, с которым заключаются договоры."
      icon={Building2}
      action={createAdvertiser}
      submitLabel="Добавить"
    >
      {({ errors }) => (
        <>
          <Field label="Название бренда" required error={errors?.name}>
            <Input name="name" autoFocus />
          </Field>
          <Field
            label="Юридическое лицо"
            hint="Подставляется в договоры бренда."
            error={errors?.legalName}
          >
            <Input name="legalName" placeholder="ООО «…»" />
          </Field>
          <Field label="Контактное лицо" error={errors?.contact}>
            <Input name="contact" />
          </Field>
          <Field label="Email" error={errors?.email}>
            <Input name="email" type="email" autoComplete="off" />
          </Field>
        </>
      )}
    </CreateDrawer>
  )
}
