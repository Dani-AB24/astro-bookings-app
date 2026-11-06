import { ApiError, NETWORK_ERROR_STATUS } from '../api/api-error.ts'
import { toFormErrors, type FormErrors } from '../forms/form-errors.ts'

const PAYMENT_DECLINED_STATUS = 402

const PAYMENT_DECLINED_MESSAGE = 'Your payment was declined, so no booking was made. You can try again.'
const UNREACHABLE_MESSAGE = 'The booking could not be completed because the service cannot be reached. Please try again.'

const BOOKING_FIELDS = ['seats'] as const

export type BookingFailure = FormErrors<(typeof BOOKING_FIELDS)[number]>

/**
 * Maps a failed booking to what the page shows. The API's 402 text does not say that nothing was booked,
 * so the client says it; other responses keep the API's own message, and seats errors go beside the input.
 */
export function toBookingFailure(error: unknown): BookingFailure {
  if (error instanceof ApiError && error.status === PAYMENT_DECLINED_STATUS) {
    return { fields: {}, form: PAYMENT_DECLINED_MESSAGE }
  }
  if (error instanceof ApiError && error.status === NETWORK_ERROR_STATUS) {
    return { fields: {}, form: UNREACHABLE_MESSAGE }
  }
  return toFormErrors(error, BOOKING_FIELDS)
}
