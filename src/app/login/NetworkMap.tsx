'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'

interface Slot {
  code: string
  name?: string
  /** Положение в сетке 6×4. */
  area: string
  highlight?: boolean
}

// Карта размещений 6×4: каналы — занятые клетки, свободные заштрихованы.
const SLOTS: Slot[] = [
  {
    code: 'A1',
    name: 'Кампания',
    area: 'col-[1/3] row-[1/3]',
    highlight: true,
  },
  { code: 'A2', name: 'ТВ', area: 'col-[3/5] row-[1/2]' },
  { code: 'A3', area: 'col-[5/7] row-[1/2]' },
  { code: 'B1', name: 'Digital', area: 'col-[3/5] row-[2/4]' },
  { code: 'B2', name: 'Наружка', area: 'col-[5/7] row-[2/3]' },
  { code: 'C1', name: 'Стенды', area: 'col-[1/3] row-[3/4]' },
  { code: 'C2', area: 'col-[5/6] row-[3/4]' },
  { code: 'C3', area: 'col-[6/7] row-[3/5]' },
  { code: 'D1', name: 'Соцсети', area: 'col-[1/4] row-[4/5]' },
  { code: 'D2', area: 'col-[4/6] row-[4/5]' },
]

export function NetworkMap() {
  return (
    <div className="relative">
      <div className="eyebrow mb-3 flex items-center justify-between text-white/40">
        <span>Карта размещений</span>
        <span className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 border border-white/40" />
            Каналы
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 border border-dashed border-white/30" />
            Свободно
          </span>
        </span>
      </div>
      <div className="grid grid-cols-6 grid-rows-[repeat(4,64px)] gap-1.5 border border-white/15 p-1.5 xl:grid-rows-[repeat(4,76px)]">
        {SLOTS.map((slot, index) => (
          <motion.div
            key={slot.code}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 + index * 0.05, duration: 0.3 }}
            className={cn(
              'relative flex flex-col justify-between p-2.5',
              slot.area,
              slot.highlight
                ? 'bg-lime-300 text-forest'
                : slot.name
                  ? 'border border-white/20 bg-white/[0.04] text-white'
                  : 'border border-dashed border-white/15 bg-[repeating-linear-gradient(-45deg,rgba(255,255,255,0.05)_0_1px,transparent_1px_7px)] text-white/30',
            )}
          >
            <span
              className={cn(
                'font-mono text-[10px] font-semibold tracking-wider',
                slot.highlight ? 'text-forest/60' : 'text-white/35',
              )}
            >
              {slot.code}
            </span>
            {slot.name && (
              <span
                className={cn(
                  'font-display font-bold leading-tight',
                  slot.highlight ? 'text-lg' : 'text-[12.5px]',
                )}
              >
                {slot.name}
              </span>
            )}
          </motion.div>
        ))}
      </div>
      <div className="eyebrow mt-3 flex items-center justify-between text-white/35">
        <span>Сеть AdNexus</span>
        <span>4 канала · 6 свободно</span>
      </div>
    </div>
  )
}
