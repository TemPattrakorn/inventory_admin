// Date formatting utilities for Thai locale with Buddhist Era calendar
// Outputs examples: "1 ส.ค. 2568 14:23" or "12 ธ.ค. 2568 02:03"

type InputDate = string | number | Date | null | undefined

function toDate(value: InputDate): Date | null {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  return isNaN(d.getTime()) ? null : d
}

export function formatDateTimeThai(value: InputDate): string {
  const date = toDate(value)
  if (!date) return '-'
  return new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(date)
    .replace(/\u200E/g, '')
}

export function formatDateThai(value: InputDate, monthStyle: 'short' | 'long' = 'short'): string {
  const date = toDate(value)
  if (!date) return ''
  return new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
    day: 'numeric',
    month: monthStyle,
    year: 'numeric',
  })
    .format(date)
    .replace(/\u200E/g, '')
}

export function formatThaiMonthYear(value: InputDate, monthStyle: 'short' | 'long' = 'long'): string {
  const date = toDate(value)
  if (!date) return ''
  return new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
    month: monthStyle,
    year: 'numeric',
  })
    .format(date)
    .replace(/\u200E/g, '')
}

export function getThaiMonthName(date: InputDate, monthStyle: 'short' | 'long' = 'long'): string {
  const d = toDate(date)
  if (!d) return ''
  const parts = new Intl.DateTimeFormat('th-TH-u-ca-buddhist', { month: monthStyle }).formatToParts(d)
  const month = parts.find(p => p.type === 'month')?.value || ''
  return month
}

