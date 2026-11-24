import 'server-only'
import { isEmail, text, type FormState } from '@/lib/forms'
import { PHONE_LENGTH, phoneDigits } from '@/lib/phone'

const LOGIN = /^[a-z0-9._-]{3,32}$/
const MIN_PASSWORD = 8

/** Поля пользователя — рекламодателя или сотрудника; при правке пустой пароль — прежний. */
export function readUser(fd: FormData, passwordRequired: boolean) {
  const firstName = text(fd, 'firstName', 60)
  const lastName = text(fd, 'lastName', 60)
  const email = text(fd, 'email', 200).toLowerCase()
  const phone = phoneDigits(text(fd, 'phone', 32))
  const login = text(fd, 'login', 64).toLowerCase()
  const password = String(fd.get('password') ?? '')
  const status = text(fd, 'status', 10)

  const errors: Record<string, string> = {}
  if (email && !isEmail(email)) errors.email = 'Проверьте адрес почты'
  if (phone && phone.length !== PHONE_LENGTH) {
    errors.phone = 'Девять цифр после +998'
  }
  if (!LOGIN.test(login)) {
    errors.login = 'Латиница, цифры, точка, дефис или _; от 3 до 32 символов'
  }
  if (
    (passwordRequired || password) &&
    (password.length < MIN_PASSWORD || password.length > 128)
  ) {
    errors.password = `Не короче ${MIN_PASSWORD} символов`
  }
  if (status !== 'active' && status !== 'off') errors.status = 'Выберите статус'
  if (Object.keys(errors).length) return { ok: false as const, errors }

  return {
    ok: true as const,
    password,
    values: {
      firstName,
      lastName,
      email,
      phone,
      login,
      // В шапке показываем имя, а без него — логин.
      name: `${firstName} ${lastName}`.trim() || login,
      isActive: status === 'active',
    },
  }
}

export const LOGIN_TAKEN: FormState = {
  errors: { login: 'Такой логин уже занят' },
}
