import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { ApiError } from '../api/api-error.ts'
import { createBooking, getBookings } from '../api/client.ts'
import type { BookingWithLaunch, CreateBookingRequest } from '../api/types.ts'
import { LAUNCHES_QUERY_KEY } from '../launches/launch-queries.ts'

/** The person's bookings. AuthProvider resets the cache when the session changes, so one person never sees another's. */
export const BOOKINGS_QUERY_KEY = ['bookings'] as const

// A 400 for a valid form, such as a capacity error or a closed launch, usually means the page's launch is stale.
const STALE_LAUNCH_STATUS = 400

/** The person's bookings, newest first. `GET /bookings` has no sort parameters, so the client sorts. */
export function useBookings() {
  return useQuery({
    queryKey: BOOKINGS_QUERY_KEY,
    queryFn: ({ signal }) => getBookings(signal),
    select: sortNewestFirst,
  })
}

function sortNewestFirst(bookings: BookingWithLaunch[]): BookingWithLaunch[] {
  return bookings.toSorted((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
}

/**
 * Books seats at most once at a time. The API has no idempotency key, so a second request would charge again.
 * `isPending` reaches React asynchronously, so a fast second click can land before the button is disabled;
 * the ref blocks it synchronously.
 */
export function useBookSeats() {
  const queryClient = useQueryClient()
  const isSubmittingRef = useRef(false)
  const mutation = useMutation({
    mutationFn: createBooking,
    onSuccess: async () => {
      // The `['launches']` prefix also covers each launch's detail query.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: LAUNCHES_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEY }),
      ])
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.status === STALE_LAUNCH_STATUS) {
        await queryClient.invalidateQueries({ queryKey: LAUNCHES_QUERY_KEY })
      }
    },
  })

  function book(details: CreateBookingRequest) {
    if (isSubmittingRef.current) {
      return
    }
    isSubmittingRef.current = true
    mutation.mutate(details, {
      onSettled: () => {
        isSubmittingRef.current = false
      },
    })
  }

  return { ...mutation, book }
}
