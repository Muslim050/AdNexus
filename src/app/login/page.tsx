import type { Metadata } from 'next'
import { MapPin } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { NetworkMap } from './NetworkMap'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = { title: 'Вход' }

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-surface lg:grid-cols-[minmax(0,1.25fr)_minmax(440px,0.75fr)]">
      <aside className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-forest px-10 py-10 text-white lg:flex xl:px-16 xl:py-12">
        <div className="pointer-events-none absolute inset-0 bg-blueprint bg-size-[32px_32px] mask-[linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-white/10" />

        <div className="relative flex items-center justify-between">
          <Logo size={44} inverted />
          <span className="eyebrow text-white/40">CRM Platform</span>
        </div>

        <div className="relative my-10 max-w-[620px] animate-fade-up">
          <p className="eyebrow text-lime-300">Рекламная платформа</p>
          <h2 className="mt-4 font-display text-[36px] font-extrabold leading-[1.08] tracking-[-0.035em] xl:text-[46px]">
            Все публикации, договоры, оплаты и&nbsp;отчёты — в&nbsp;едином
            кабинете AdNexus
          </h2>
        </div>

        <div className="relative max-w-[620px]">
          <NetworkMap />
        </div>

        <div className="relative mt-10 flex items-center gap-2 text-[12px] text-white/40">
          <MapPin size={14} />
          Ташкент
        </div>
      </aside>

      <section className="relative flex flex-col">
        <div className="flex items-center bg-forest px-6 py-4 lg:hidden">
          <Logo size={36} inverted />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-12">
          <LoginForm />
        </div>

        <div className="eyebrow flex items-center justify-between border-t border-line px-6 py-4 text-ink-muted sm:px-12">
          <span>© AdNexus</span>
          <span>CRM Platform</span>
        </div>
      </section>
    </main>
  )
}
