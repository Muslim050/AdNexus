import { NextResponse, type NextRequest } from 'next/server'
import { HOME } from '@/lib/routes'
import { SESSION_COOKIE, decodeSession } from '@/lib/token'

/**
 * Оптимистичная проверка до рендера: без валидной cookie — на вход,
 * с cookie на странице входа — в кабинет. Это не авторизация: роли и
 * активность пользователя страницы проверяют сами, с базой (lib/auth).
 */
export function proxy(request: NextRequest) {
  const session = decodeSession(request.cookies.get(SESSION_COOKIE)?.value)
  const { pathname } = request.nextUrl
  const onLogin = pathname === '/login'

  if (!session && !onLogin) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (session && onLogin) {
    // Доступ закрыли при живой cookie: убираем её и показываем вход.
    if (request.nextUrl.searchParams.has('ended')) {
      const response = NextResponse.next()
      response.cookies.delete(SESSION_COOKIE)
      return response
    }
    return NextResponse.redirect(new URL(HOME, request.url))
  }
  return NextResponse.next()
}

export const config = {
  // Всё, кроме статики, файлов Next и иконки.
  matcher: [
    '/((?!_next/static|_next/image|icon.svg|favicon.ico|.*\\.[a-z0-9]+$).*)',
  ],
}
