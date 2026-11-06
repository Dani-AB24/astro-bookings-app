import { ApiError, NETWORK_ERROR_STATUS } from './api-error.ts'
import { readSession } from '../auth/session.ts'
import type {
  ApiErrorBody,
  AuthResponse,
  Booking,
  BookingWithLaunch,
  CreateBookingRequest,
  HealthResponse,
  Launch,
  LoginRequest,
  RegisterRequest,
} from './types.ts'

const DEFAULT_API_URL = 'http://localhost:3000'
const UNAUTHORIZED_STATUS = 401

/** Called with the token the API rejected, so the session holder can end that session. */
export type UnauthorizedHandler = (rejectedToken: string) => void

let unauthorizedHandler: UnauthorizedHandler | undefined

export const API_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL

export { ApiError } from './api-error.ts'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

/** Registered by AuthProvider, which lives outside this module and owns the session state. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | undefined): void {
  unauthorizedHandler = handler
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = readSession()?.accessToken
  const response = await send(path, options, token)
  // Only a request that carried a token can reveal an expired session; a wrong password on login is also a 401.
  if (response.status === UNAUTHORIZED_STATUS && token !== undefined) {
    unauthorizedHandler?.(token)
  }
  const body = await readJson(response)

  if (!response.ok) {
    throw toApiError(response, body)
  }
  return body as T
}

export function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return apiRequest<HealthResponse>('/health', { signal })
}

export function login(credentials: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/login', { method: 'POST', body: credentials })
}

export function register(details: RegisterRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/users', { method: 'POST', body: details })
}

/** Every non-draft launch, soonest first. */
export function getLaunches(signal?: AbortSignal): Promise<Launch[]> {
  return apiRequest<Launch[]>('/launches?_sort=date&_order=asc', { signal })
}

export function getLaunch(id: string, signal?: AbortSignal): Promise<Launch> {
  return apiRequest<Launch>(`/launches/${encodeURIComponent(id)}`, { signal })
}

/** Books and charges immediately. The API has no idempotency key, so each call can create a booking. */
export function createBooking(details: CreateBookingRequest): Promise<Booking> {
  return apiRequest<Booking>('/bookings', { method: 'POST', body: details })
}

/** The logged-in person's own bookings, in no particular order. */
export function getBookings(signal?: AbortSignal): Promise<BookingWithLaunch[]> {
  return apiRequest<BookingWithLaunch[]>('/bookings', { signal })
}

async function send(
  path: string,
  { method = 'GET', body, signal }: RequestOptions,
  token: string | undefined,
): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (token !== undefined) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    return await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (signal?.aborted) {
      throw error
    }
    throw new ApiError(NETWORK_ERROR_STATUS, 'The AstroBookings service cannot be reached.')
  }
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (text === '') {
    return undefined
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new ApiError(response.status, 'The AstroBookings service sent an unexpected response.')
  }
}

function toApiError(response: Response, body: unknown): ApiError {
  if (!isApiErrorBody(body)) {
    return new ApiError(response.status, response.statusText || 'The request failed.')
  }
  return new ApiError(response.status, body.message, body.errors ?? [])
}

function isApiErrorBody(body: unknown): body is ApiErrorBody {
  return typeof body === 'object' && body !== null && typeof (body as ApiErrorBody).message === 'string'
}
