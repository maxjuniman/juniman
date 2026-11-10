import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function parseDateInput(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatDateInput(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function formatTimeInput(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function timeToDate(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  const date = new Date()
  date.setHours(hour || 0, minute || 0, 0, 0)
  return date
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function formatLongDate(date: Date) {
  return capitalize(format(date, "EEEE, d 'de' MMMM", { locale: ptBR }))
}

export function formatShortDate(value: string) {
  return format(parseDateInput(value), "d 'de' MMM", { locale: ptBR })
}

export function formatMonth(date: Date) {
  return capitalize(format(date, 'MMMM yyyy', { locale: ptBR }))
}

export function formatWeekRange(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const end = endOfWeek(date, { weekStartsOn: 1 })
  if (start.getMonth() === end.getMonth()) {
    return `${format(start, 'd')} – ${format(end, "d 'de' MMMM", { locale: ptBR })}`
  }
  return `${format(start, "d 'de' MMM", { locale: ptBR })} – ${format(end, "d 'de' MMM", { locale: ptBR })}`
}

export function weekDays(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, index) => addDays(start, index))
}

export function monthGrid(date: Date) {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 })
  const days: Date[] = []
  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
    days.push(cursor)
  }
  return { from: start, to: end, days }
}

export function sameDay(left: Date, right: Date) {
  return formatDateInput(left) === formatDateInput(right)
}
