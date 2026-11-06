import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { ApiError } from '../api/api-error.ts'
import { createBooking } from '../api/client.ts'
import type { CreateBookingRequest } from '../api/types.ts'
import { LAUNCHES_QUERY_KEY } from '../launches/launch-queries.ts'

/** view-bookings reads the person's bookings under this key. */
export const BOOKINGS_QUERY_KEY = ['bookings'] as const

// A 400 for a valid form, such as a capacity error or a closed launch, usually means the page's launch is stale.
const STALE_LAUNCH_STATUS = 400

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
