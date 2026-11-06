import { formatSeats } from '../utils/format.ts'

export type SeatCountCheck = { valid: true; seats: number } | { valid: false; message: string }

const WHOLE_NUMBER = /^\d+$/
const MIN_SEATS = 1

/**
 * Checks the raw text of the seats input, so an empty field or a fraction is caught rather than
 * coerced into a number. The launch's `minSeats` is not applied, because the API does not check it per booking.
 */
export function checkSeatCount(rawValue: string, availableSeats: number): SeatCountCheck {
  const trimmed = rawValue.trim()
  if (!WHOLE_NUMBER.test(trimmed) || Number(trimmed) < MIN_SEATS) {
    return { valid: false, message: `Enter a whole number of seats, from ${MIN_SEATS} to ${availableSeats}.` }
  }
  const seats = Number(trimmed)
  if (seats > availableSeats) {
    return { valid: false, message: `You can book up to ${formatSeats(availableSeats)}.` }
  }
  return { valid: true, seats }
}
