'use client'

import { useState } from 'react'
import { EditContractDrawer } from '@/components/forms/NewContract'
import { ListOrGrid } from '@/components/ui/ListOrGrid'
import type { ContractRow } from '@/lib/data/contracts'
import { ContractDetails } from './ContractDetails'
import { ContractGrid } from './ContractGrid'
import { ContractTable } from './ContractTable'
import { ListSearch, matches } from './ListSearch'

/**
 * Договоры таблицей или карточками с поиском; клик открывает карточку
 * договора, из неё — правка.
 */
export function ContractsView({
  rows,
  canEdit,
}: {
  rows: ContractRow[]
  canEdit: boolean
}) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [editing, setEditing] = useState({ id: '', open: false, round: 0 })
  const [query, setQuery] = useState('')
  const found = rows.filter(({ contract: c, advertiserName }) =>
    matches(query, [c.number, advertiserName, c.campaignName, c.legalName]),
  )
  const list = { rows: found, onOpen: setOpenId }
  const edited = rows.find((r) => r.contract.id === editing.id)

  return (
    <>
      <ListSearch
        value={query}
        onChange={setQuery}
        placeholder="Номер договора, бренд или кампания"
        found={found.length}
        total={rows.length}
      />
      {found.length > 0 && (
        <ListOrGrid
          storageKey="contracts-grid"
          table={<ContractTable {...list} />}
          grid={<ContractGrid {...list} />}
        />
      )}
      <ContractDetails
        row={rows.find((r) => r.contract.id === openId) ?? null}
        onClose={() => setOpenId(null)}
        onEdit={
          canEdit
            ? (id) => {
                setOpenId(null)
                setEditing((e) => ({ id, open: true, round: e.round + 1 }))
              }
            : undefined
        }
      />
      {edited && (
        <EditContractDrawer
          contract={{
            ...edited.contract,
            advertiserName: edited.advertiserName,
          }}
          open={editing.open}
          onClose={() => setEditing((e) => ({ ...e, open: false }))}
          round={editing.round}
        />
      )}
    </>
  )
}
