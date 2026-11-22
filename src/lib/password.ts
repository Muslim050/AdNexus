import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

/** scrypt с солью на пользователя; храним соль и хэш, но не пароль. */
export function hashPassword(
  password: string,
  salt = randomBytes(16).toString('hex'),
) {
  return { salt, hash: scryptSync(password, salt, 32).toString('hex') }
}

export function checkPassword(password: string, salt: string, hash: string) {
  const given = Buffer.from(hashPassword(password, salt).hash, 'hex')
  const stored = Buffer.from(hash, 'hex')
  return given.length === stored.length && timingSafeEqual(given, stored)
}
