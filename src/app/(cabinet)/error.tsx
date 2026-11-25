'use client'

import Link from 'next/link'
import { ErrorScreen, linkButton } from '@/components/errors/ErrorScreen'
import { Button } from '@/components/ui/Button'
import { HOME } from '@/lib/routes'

/** Сбой в разделе: шапка остаётся, раздел можно открыть заново. */
export default function SectionError({
  error,
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  const digest =
    error instanceof Error && 'digest' in error ? String(error.digest) : ''
  return (
    <ErrorScreen
      code="Ошибка"
      title="Раздел не открылся"
      text={
        <>
          Чаще всего это временный сбой связи с базой — попробуйте ещё раз. Если
          повторится, сообщите администратору
          {digest ? ` код ${digest}` : ''}.
        </>
      }
      actions={
        <>
          <Button onClick={retry}>Попробовать снова</Button>
          <Link href={HOME} className={linkButton()}>
            В календарь
          </Link>
        </>
      }
    />
  )
}
