import { Link } from 'react-router-dom'
import type { Booking } from '../api/types.ts'
import { formatSeats } from '../utils/format.ts'
import styles from './booking-section.module.css'

export function BookingConfirmation({ booking }: { booking: Booking }) {
  return (
    <div role="status" className={styles.confirmation}>
      <p>
        <strong>Booking confirmed:</strong> {formatSeats(booking.seats)}. Payment status: {booking.paymentStatus}.
      </p>
      <p>
        <Link to="/bookings">View my bookings</Link>
      </p>
    </div>
  )
}
