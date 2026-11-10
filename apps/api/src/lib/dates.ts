import { fromZonedTime } from 'date-fns-tz'
import { AppError } from './errors'
import { isValidTimeZone } from '../shared'

export function assertTimeZone(timeZone: string) {
  if (!isValidTimeZone(timeZone)) {
    throw new AppError('Fuso horário inválido.', 422, 'INVALID_TIMEZONE')
  }
}

export function toUtcDate(date: string, time: string, timeZone: string) {
  return fromZonedTime(`${date}T${time}:00`, timeZone)
}

export function dateOnly(date: string) {
  return new Date(`${date}T00:00:00.000Z`)
}

export function formatDateOnly(value: Date) {
  return value.toISOString().slice(0, 10)
}
