'use client'

import { useState } from 'react'
import { EditAdvertiserDrawer } from '@/components/forms/NewAdvertiser'
import { ListOrGrid } from '@/components/ui/ListOrGrid'
import type { AdvertiserRow } from '@/lib/data/advertisers'
import { AdvertiserDetails, type BrandContract } from './AdvertiserDetails'
import { AdvertiserGrid } from './AdvertiserGrid'
import { AdvertiserTable } from './AdvertiserTable'
import { ListSearch, matches } from './ListSearch'

/** Бренды таблицей или карточками; клик открывает карточку бренда. */
export function AdvertisersView({
  rows,
  contracts,
  canEdit,
}: {
  rows: AdvertiserRow[]
  contracts: BrandContract[]
  canEdit: boolean
}) {
  // Бренд берём из свежих данных по id: после правки карточка обновится сама.
  const [openId, setOpenId] = useState<string | null>(null)
  const [editing, setEditing] = useState({ id: '', open: false, round: 0 })
  const edited = rows.find((a) => a.id === editing.id)
  const [query, setQuery] = useState('')
  const found = rows.filter((a) =>
    matches(query, [
      a.name,
      a.legalName,
      a.contact,
      a.email,
      ...a.accounts.map((u) => u.login),
    ]),
  )
  const list = { rows: found, canEdit, onOpen: setOpenId }

  return (
    <>
      <ListSearch
        value={query}
        onChange={setQuery}
        placeholder="Бренд, юр. лицо, контакт или логин"
        found={found.length}
        total={rows.length}
      />
      {found.length > 0 && (
        <ListOrGrid
          storageKey="advertisers-grid"
          table={<AdvertiserTable {...list} />}
          grid={<AdvertiserGrid {...list} />}
        />
      )}
      <AdvertiserDetails
        advertiser={rows.find((a) => a.id === openId) ?? null}
        contracts={contracts.filter((c) => c.advertiserId === openId)}
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
        <EditAdvertiserDrawer
          advertiser={edited}
          open={editing.open}
          onClose={() => setEditing((e) => ({ ...e, open: false }))}
          round={editing.round}
        />
      )}
    </>
  )
}
