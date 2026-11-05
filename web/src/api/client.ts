import { ApiError, NETWORK_ERROR_STATUS } from './api-error.ts'
import { readSession } from '../auth/session.ts'
import type {
  ApiErrorBody,
  AuthResponse,
  HealthResponse,
  Launch,
  LoginRequest,
  RegisterRequest,
} from './types.ts'

const DEFAULT_API_URL = 'http://localhost:3000'

export const API_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL

export { ApiError } from './api-error.ts'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(path, options)
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

async function send(path: string, { method = 'GET', body, signal }: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  const session = readSession()
  if (session !== undefined) {
    headers.Authorization = `Bearer ${session.accessToken}`
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
