import { Link, useLocation } from 'react-router-dom'
import type { Launch } from '../api/types.ts'
import { useAuth } from '../auth/auth-context.ts'
import { toReturnState } from '../auth/return-location.ts'
import { getLaunchAvailability } from '../launches/launch-availability.ts'
import { BookingConfirmation } from './booking-confirmation.tsx'
import { toBookingFailure } from './booking-failure.ts'
import { BookingForm } from './booking-form.tsx'
import { useBookSeats } from './booking-queries.ts'
import styles from './booking-section.module.css'

/**
 * Offers booking on a bookable launch: the form for people logged in, a login link for visitors.
 * The booking lives here rather than in the form, so its confirmation or failure stays visible
 * when the launch stops being bookable, such as after booking the last seats or when it has closed.
 */
export function BookingSection({ launch }: { launch: Launch }) {
  const { user } = useAuth()
  const location = useLocation()
  const booking = useBookSeats()
  const isBookable = getLaunchAvailability(launch) === 'bookable'
  const failure = booking.isError ? toBookingFailure(booking.error) : undefined

  if (!isBookable && booking.data === undefined && failure === undefined) {
    return null
  }
  return (
    <section className={styles.section} aria-labelledby="booking-heading">
      <h2 id="booking-heading">Book seats</h2>
      {booking.data === undefined ? null : <BookingConfirmation booking={booking.data} />}
      {failure?.form === undefined ? null : (
        <p role="alert" className={styles.failure}>
          {failure.form}
        </p>
      )}
      {isBookable && user === undefined ? (
        <p>
          <Link to="/login" state={toReturnState(location)}>
            Log in to book seats
          </Link>
        </p>
      ) : null}
      {isBookable && user !== undefined ? (
        <BookingForm
          launch={launch}
          isPending={booking.isPending}
          seatsError={failure?.fields.seats}
          onBook={(seats) => booking.book({ launchId: launch.id, seats })}
        />
      ) : null}
    </section>
  )
}
