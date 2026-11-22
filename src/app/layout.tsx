import type { Metadata } from 'next'
import { ToastProvider } from '@/components/ui/Toast'
import { ConfirmProvider } from '@/components/ui/Confirm'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'AdNexus', template: '%s · AdNexus' },
  description:
    'AdNexus — рекламная платформа: кампании, договоры, оплаты и отчёты.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ru">
      <body>
        <ToastProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
