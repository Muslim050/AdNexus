'use client'

import { useState } from 'react'
import { ListOrGrid } from '@/components/ui/ListOrGrid'
import type { ContractRow } from '@/lib/data/contracts'
import { ContractDetails } from './ContractDetails'
import { ContractGrid } from './ContractGrid'
import { ContractTable } from './ContractTable'

/** Договоры таблицей или карточками; клик открывает карточку договора. */
export function ContractsView({ rows }: { rows: ContractRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const list = { rows, onOpen: setOpenId }
  return (
    <>
      <ListOrGrid
        storageKey="contracts-grid"
        table={<ContractTable {...list} />}
        grid={<ContractGrid {...list} />}
      />
      <ContractDetails
        row={rows.find((r) => r.contract.id === openId) ?? null}
        onClose={() => setOpenId(null)}
      />
    </>
  )
}
