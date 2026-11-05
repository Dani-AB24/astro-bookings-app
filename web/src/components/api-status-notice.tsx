import { useQuery } from '@tanstack/react-query'
import { getHealth } from '../api/client.ts'
import styles from './api-status-notice.module.css'

export const HEALTH_QUERY_KEY = ['health'] as const

/** Shows a notice only while the API cannot be reached; a healthy API shows nothing. */
export function ApiStatusNotice() {
  const { isError } = useQuery({
    queryKey: HEALTH_QUERY_KEY,
    queryFn: ({ signal }) => getHealth(signal),
    // Report an unreachable API at once instead of after several retries.
    retry: false,
  })

  return isError ? (
    <div role="alert" className={styles.notice}>
      The AstroBookings service cannot be reached. Please make sure the API is running and try again.
    </div>
  ) : null
}
