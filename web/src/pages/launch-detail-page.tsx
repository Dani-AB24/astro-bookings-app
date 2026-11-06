import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../api/api-error.ts'
import type { Launch } from '../api/types.ts'
import { BookingSection } from '../bookings/booking-section.tsx'
import { LoadError } from '../components/load-error.tsx'
import { LoadingMessage } from '../components/loading-message.tsx'
import { LaunchAvailabilityMarker } from '../launches/launch-availability-marker.tsx'
import { useLaunch } from '../launches/launch-queries.ts'
import { formatDuration, formatLaunchDate, formatLaunchStatus, formatPrice } from '../utils/format.ts'
import styles from './launch-detail-page.module.css'

const NOT_FOUND_STATUS = 404

export function LaunchDetailPage() {
  // The route always supplies `id`; the fallback only satisfies the type.
  const { id = '' } = useParams()
  const { data: launch, error, isPending, isFetching, refetch } = useLaunch(id)

  if (error instanceof ApiError && error.status === NOT_FOUND_STATUS) {
    return <LaunchNotFound />
  }
  return (
    <section className={styles.page}>
      {isPending ? <LoadingMessage>Loading launch…</LoadingMessage> : null}
      {error ? (
        <LoadError message="The launch could not be loaded." onRetry={() => void refetch()} isRetrying={isFetching} />
      ) : null}
      {launch ? <LaunchDetails launch={launch} /> : null}
    </section>
  )
}

function LaunchDetails({ launch }: { launch: Launch }) {
  return (
    <>
      <h1>{launch.name}</h1>
      <LaunchAvailabilityMarker launch={launch} />
      <dl className={styles.facts}>
        <div>
          <dt>Rocket</dt>
          <dd>{launch.rocket}</dd>
        </div>
        <div>
          <dt>Price per seat</dt>
          <dd>{formatPrice(launch.price)}</dd>
        </div>
        <div>
          <dt>Date</dt>
          <dd>{formatLaunchDate(launch.date)}</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>{formatDuration(launch.duration)}</dd>
        </div>
        <div>
          <dt>Launch site</dt>
          <dd>{launch.launchSite}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{formatLaunchStatus(launch.status)}</dd>
        </div>
        <div>
          <dt>Available seats</dt>
          <dd>{launch.availableSeats}</dd>
        </div>
        <div>
          <dt>Total seats</dt>
          <dd>{launch.totalSeats}</dd>
        </div>
      </dl>
      <BookingSection launch={launch} />
      <p>
        <Link to="/">All launches</Link>
      </p>
    </>
  )
}

function LaunchNotFound() {
  return (
    <section className={styles.page}>
      <h1>Launch not found</h1>
      <p className={styles.message}>There is no launch at this address.</p>
      <p>
        <Link to="/">Back to the launch list</Link>
      </p>
    </section>
  )
}
