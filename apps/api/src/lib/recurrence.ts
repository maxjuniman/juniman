import { dateOnly, formatDateOnly } from './dates'

function addUtcDays(date: Date, days: number) {
  const next = new Date(date.getTime())
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

export function eachDate(from: string, to: string) {
  const dates: string[] = []
  if (from > to) return dates
  for (let cursor = dateOnly(from); formatDateOnly(cursor) <= to; cursor = addUtcDays(cursor, 1)) {
    dates.push(formatDateOnly(cursor))
  }
  return dates
}

export function weekdayOf(date: string) {
  return dateOnly(date).getUTCDay()
}

export function weeklyDates(anchor: string, from: string, to: string) {
  const start = from > anchor ? from : anchor
  if (start > to) return []
  const weekday = weekdayOf(anchor)
  return eachDate(start, to).filter((day) => weekdayOf(day) === weekday)
}
