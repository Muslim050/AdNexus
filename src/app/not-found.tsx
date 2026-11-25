import Link from 'next/link'
import { ErrorScreen, linkButton } from '@/components/errors/ErrorScreen'
import { HOME } from '@/lib/routes'

export default function NotFound() {
  return (
    <ErrorScreen
      full
      code="404"
      title="Страница не найдена"
      text="Адрес мог устареть или в нём опечатка. Все разделы — в меню кабинета."
      actions={
        <Link href={HOME} className={linkButton(true)}>
          В кабинет
        </Link>
      }
    />
  )
}
