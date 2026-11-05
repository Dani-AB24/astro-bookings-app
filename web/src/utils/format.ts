import type { LaunchStatus } from '../api/types.ts'

// A fixed locale keeps output in the interface language and makes tests predictable.
const LOCALE = 'en-US'
// The API has no currency, so this is an assumption kept in one place.
const CURRENCY = 'USD'

const MINUTES_PER_HOUR = 60
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR

const priceFormat = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY })

// Launches are global events, so dates use the browser's time zone and name it.
const dateFormat = new Intl.DateTimeFormat(LOCALE, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short',
})

const durationParts = new Intl.ListFormat(LOCALE, { style: 'long', type: 'conjunction' })

type DurationUnit = 'day' | 'hour' | 'minute'

const STATUS_LABELS: Record<LaunchStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  confirmed: 'Confirmed',
  'sold-out': 'Sold out',
  done: 'Done',
  cancelled: 'Cancelled',
}

export function formatPrice(amount: number): string {
  return priceFormat.format(amount)
}

export function formatLaunchDate(isoDate: string): string {
  return dateFormat.format(new Date(isoDate))
}

/** Converts minutes into the largest sensible units, so 10080 shows as `7 days`. */
export function formatDuration(totalMinutes: number): string {
  const days = Math.floor(totalMinutes / MINUTES_PER_DAY)
  const hours = Math.floor((totalMinutes % MINUTES_PER_DAY) / MINUTES_PER_HOUR)
  const minutes = totalMinutes % MINUTES_PER_HOUR

  const parts = [formatUnit(days, 'day'), formatUnit(hours, 'hour'), formatUnit(minutes, 'minute')].filter(
    (part) => part !== '',
  )
  return parts.length === 0 ? formatUnit(0, 'minute', true) : durationParts.format(parts)
}

export function formatLaunchStatus(status: LaunchStatus): string {
  return STATUS_LABELS[status]
}

export function formatSeats(count: number): string {
  return `${count} ${count === 1 ? 'seat' : 'seats'}`
}

function formatUnit(value: number, unit: DurationUnit, showZero = false): string {
  if (value === 0 && !showZero) {
    return ''
  }
  return new Intl.NumberFormat(LOCALE, { style: 'unit', unit, unitDisplay: 'long' }).format(value)
}
