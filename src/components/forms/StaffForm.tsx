'use client'

import { useState } from 'react'
import { Pencil, UserCog } from 'lucide-react'
import { createStaff, updateStaff } from '@/app/actions/staff'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { SelectField } from '@/components/ui/SelectField'
import type { FormState } from '@/lib/forms'
import { ROLE_INFO, STAFF, type StaffRole } from '@/lib/roles'
import { AccountFields, type AccountInitial } from './AdvertiserAccess'
import { CreateDrawer, FormDrawer } from './CreateDrawer'

export interface StaffInitial extends AccountInitial {
  role: StaffRole
}

export function NewStaff() {
  return (
    <CreateDrawer
      dialog
      label="Добавить сотрудника"
      title="Новый сотрудник"
      description="Доступ к платформе для команды площадки."
      icon={UserCog}
      action={createStaff}
      submitLabel="Добавить"
    >
      {(state) => (
        <AccountFields state={state} receiver="сотруднику">
          <RoleField state={state} role="manager" />
        </AccountFields>
      )}
    </CreateDrawer>
  )
}

export function EditStaff({
  staff,
  isSelf,
}: {
  staff: StaffInitial
  /** Своя запись: роль и статус не меняются. */
  isSelf: boolean
}) {
  const [open, setOpen] = useState(false)
  const [round, setRound] = useState(0)
  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        aria-label={`Изменить: ${staff.login}`}
        onClick={() => {
          setRound((r) => r + 1)
          setOpen(true)
        }}
      >
        <Pencil size={14} />
        Изменить
      </Button>
      <FormDrawer
        dialog
        open={open}
        onClose={() => setOpen(false)}
        round={round}
        title="Изменить сотрудника"
        description={
          isSelf
            ? 'Это ваша запись: роль и статус меняет другой администратор.'
            : staff.login
        }
        icon={UserCog}
        action={updateStaff}
        submitLabel="Сохранить"
      >
        {(state) => (
          <>
            <input type="hidden" name="id" value={staff.id} />
            <AccountFields state={state} initial={staff} lockStatus={isSelf}>
              {!isSelf && <RoleField state={state} role={staff.role} />}
            </AccountFields>
          </>
        )}
      </FormDrawer>
    </>
  )
}

function RoleField({ state, role }: { state: FormState; role: StaffRole }) {
  const [value, setValue] = useState<string>(role)
  return (
    <Field
      label="Роль"
      required
      hint={
        STAFF.find((r) => r === value) && ROLE_INFO[value as StaffRole].about
      }
      error={state.errors?.role}
    >
      <SelectField
        name="role"
        value={value}
        onChange={setValue}
        invalid={!!state.errors?.role}
        options={STAFF.map((r) => ({ value: r, label: ROLE_INFO[r].label }))}
      />
    </Field>
  )
}
