import bcrypt from 'bcrypt'

const ROUNDS = 12

export function hashPassword(value: string) {
  return bcrypt.hash(value, ROUNDS)
}

export function verifyPassword(value: string, hash: string) {
  return bcrypt.compare(value, hash)
}
