'use client'

import './globals.css'
import { ErrorScreen } from '@/components/errors/ErrorScreen'
import { Button } from '@/components/ui/Button'

/** Сбой в корневом каркасе: своя страница, со своими стилями. */
export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="ru">
      <body>
        <title>Ошибка · AdNexus</title>
        <ErrorScreen
          full
          code="Ошибка"
          title="Кабинет не загрузился"
          text="Попробуйте ещё раз. Если повторится, сообщите администратору."
          actions={<Button onClick={retry}>Попробовать снова</Button>}
        />
      </body>
    </html>
  )
}
