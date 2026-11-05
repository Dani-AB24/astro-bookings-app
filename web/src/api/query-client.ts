import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './api-error.ts'

const MAX_RETRIES = 2

// A 4xx will not change on retry, so surface it straight away.
function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.isClientError) {
    return false
  }
  return failureCount < MAX_RETRIES
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: shouldRetry },
    mutations: { retry: false },
  },
})
