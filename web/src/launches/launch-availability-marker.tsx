import type { Launch } from '../api/types.ts'
import { getLaunchAvailability, type LaunchAvailability } from './launch-availability.ts'
import styles from './launch-availability-marker.module.css'

const MARKER_TEXT: Record<Exclude<LaunchAvailability, 'bookable'>, string> = {
  full: 'Full',
  'not-open': 'Not open for booking',
}

/** Marks a launch that cannot be booked; a bookable launch shows nothing. */
export function LaunchAvailabilityMarker({ launch }: { launch: Launch }) {
  const availability = getLaunchAvailability(launch)
  return availability === 'bookable' ? null : <p className={styles.marker}>{MARKER_TEXT[availability]}</p>
}
