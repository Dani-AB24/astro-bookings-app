import type { Launch, LaunchStatus } from '../api/types.ts'

export type LaunchAvailability = 'bookable' | 'full' | 'not-open'

const FINISHED_STATUSES: readonly LaunchStatus[] = ['done', 'cancelled']

/**
 * The one rule for whether a launch can be booked. It reads `availableSeats` rather than
 * the `sold-out` status, because the API never sets `sold-out` itself.
 */
export function getLaunchAvailability(launch: Pick<Launch, 'availableSeats' | 'status'>): LaunchAvailability {
  if (launch.availableSeats === 0) {
    return 'full'
  }
  return launch.status === 'published' ? 'bookable' : 'not-open'
}

/** Finished launches can never be booked, so the list hides them; their detail pages still work. */
export function isShownInLaunchList(launch: Pick<Launch, 'status'>): boolean {
  return !FINISHED_STATUSES.includes(launch.status)
}
