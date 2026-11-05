import type { ApiFieldError } from './types.ts'

/** Status used when the request never got a response, such as when the API is down. */
export const NETWORK_ERROR_STATUS = 0

/** The one error type every API call rejects with, so pages handle failures the same way. */
export class ApiError extends Error {
  readonly status: number
  readonly errors: ApiFieldError[]

  constructor(status: number, message: string, errors: ApiFieldError[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500
  }
}
