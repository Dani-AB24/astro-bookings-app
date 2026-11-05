import { useQuery } from '@tanstack/react-query'
import { getLaunch, getLaunches } from '../api/client.ts'

/** book-seats invalidates these keys after a booking. */
export const LAUNCHES_QUERY_KEY = ['launches'] as const

export function launchQueryKey(id: string) {
  return [...LAUNCHES_QUERY_KEY, id] as const
}

export function useLaunches() {
  return useQuery({
    queryKey: LAUNCHES_QUERY_KEY,
    queryFn: ({ signal }) => getLaunches(signal),
  })
}

export function useLaunch(id: string) {
  return useQuery({
    queryKey: launchQueryKey(id),
    queryFn: ({ signal }) => getLaunch(id, signal),
  })
}
