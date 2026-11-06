import { Link } from 'react-router-dom'
import type { BookingWithLaunch } from '../api/types.ts'
import { useBookings } from '../bookings/booking-queries.ts'
import { LoadError } from '../components/load-error.tsx'
import { LoadingMessage } from '../components/loading-message.tsx'
import { formatBookingDate, formatLaunchDate, formatLaunchStatus, formatPaymentStatus } from '../utils/format.ts'
import styles from './bookings-page.module.css'

export function BookingsPage() {
  return (
    <section className={styles.page}>
      <h1>My bookings</h1>
      <BookingList />
    </section>
  )
}

function BookingList() {
  // A 401 is handled by AuthProvider, which logs the person out and sends them to log in.
  const { data: bookings, isPending, isError, isFetching, refetch } = useBookings()

  if (isPending) {
    return <LoadingMessage>Loading bookings…</LoadingMessage>
  }
  if (isError) {
    return (
      <LoadError message="Your bookings could not be loaded." onRetry={() => void refetch()} isRetrying={isFetching} />
    )
  }
  if (bookings.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.message}>You have no bookings yet.</p>
        <p>
          <Link to="/">Browse launches</Link>
        </p>
      </div>
    )
  }
  return (
    <ul className={styles.list} aria-label="Bookings">
      {bookings.map((booking) => (
        <BookingCard key={booking.id} booking={booking} />
      ))}
    </ul>
  )
}

function BookingCard({ booking }: { booking: BookingWithLaunch }) {
  const { launch } = booking
  return (
    <li className={styles.card}>
      <h2 className={styles.name}>
        <Link to={`/launches/${booking.launchId}`}>{launch.name}</Link>
      </h2>
      <dl className={styles.facts}>
        <div>
          <dt>Rocket</dt>
          <dd>{launch.rocket}</dd>
        </div>
        <div>
          <dt>Launch date</dt>
          <dd>{formatLaunchDate(launch.date)}</dd>
        </div>
        <div>
          <dt>Launch site</dt>
          <dd>{launch.launchSite}</dd>
        </div>
        <div>
          <dt>Seats</dt>
          <dd>{booking.seats}</dd>
        </div>
        <div>
          <dt>Booked</dt>
          <dd>{formatBookingDate(booking.createdAt)}</dd>
        </div>
        <div>
          <dt>Payment</dt>
          <dd>{formatPaymentStatus(booking.paymentStatus)}</dd>
        </div>
        <div>
          <dt>Launch status</dt>
          <dd>{formatLaunchStatus(launch.status)}</dd>
        </div>
      </dl>
    </li>
  )
}
