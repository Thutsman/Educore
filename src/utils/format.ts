import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'

/**
 * Format a number as currency (ZWG by default for Zimbabwean context).
 */
export function formatCurrency(
  amount: number,
  currency = 'USD',
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a date string or Date object.
 */
export function formatDate(
  date: string | Date | null | undefined,
  pattern = 'dd MMM yyyy'
): string {
  if (!date) return '—'
  const parsed = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(parsed)) return '—'
  return format(parsed, pattern)
}

/**
 * Format a datetime string.
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, 'dd MMM yyyy, HH:mm')
}

/**
 * Relative time (e.g., "3 hours ago").
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const parsed = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(parsed)) return '—'
  return formatDistanceToNow(parsed, { addSuffix: true })
}

/**
 * Format a number with thousand separators.
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

/**
 * Format percentage.
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Truncate a string to a max length.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

/**
 * Get initials from a full name.
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}
