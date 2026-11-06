import { Link } from 'react-router-dom'
import type { Launch } from '../api/types.ts'
import { LoadError } from '../components/load-error.tsx'
import cardStyles from '../components/card.module.css'
import { LoadingMessage } from '../components/loading-message.tsx'
import { LaunchAvailabilityMarker } from '../launches/launch-availability-marker.tsx'
import { isShownInLaunchList } from '../launches/launch-availability.ts'
import { useLaunches } from '../launches/launch-queries.ts'
import { formatLaunchDate, formatPrice, formatSeats } from '../utils/format.ts'
import styles from './home-page.module.css'

export function HomePage() {
  return (
    <section className={styles.page}>
      <header className={styles.intro}>
        <h1>Welcome to AstroBookings</h1>
        <p className={styles.lead}>Book your seat on an upcoming rocket launch.</p>
      </header>
      <h2>Upcoming launches</h2>
      <LaunchList />
    </section>
  )
}

function LaunchList() {
  const { data: launches, isPending, isError, isFetching, refetch } = useLaunches()

  if (isPending) {
    return <LoadingMessage>Loading launches…</LoadingMessage>
  }
  if (isError) {
    return (
      <LoadError
        message="The launches could not be loaded."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    )
  }

  const listedLaunches = launches.filter(isShownInLaunchList)
  if (listedLaunches.length === 0) {
    return <p className={styles.lead}>There are no launches available right now.</p>
  }
  return (
    <ul className={styles.list} aria-label="Launches">
      {listedLaunches.map((launch) => (
        <LaunchCard key={launch.id} launch={launch} />
      ))}
    </ul>
  )
}

function LaunchCard({ launch }: { launch: Launch }) {
  return (
    <li className={cardStyles.card}>
      <h3 className={cardStyles.title}>
        <Link to={`/launches/${launch.id}`}>{launch.name}</Link>
      </h3>
      <dl className={cardStyles.facts}>
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
          <dt>Launch site</dt>
          <dd>{launch.launchSite}</dd>
        </div>
      </dl>
      <p className={styles.seats}>{formatSeats(launch.availableSeats)} available</p>
      <LaunchAvailabilityMarker launch={launch} />
    </li>
  )
}
