import type { AuthResponse } from '../api/types.ts'

/** The stored session keeps the user with the token, because the API has no route to fetch the username again. */
export type Session = AuthResponse

export const SESSION_STORAGE_KEY = 'astrobookings.session'

/** Returns the stored session, or nothing when it is missing or cannot be read. */
export function readSession(): Session | undefined {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY)
    if (stored === null) {
      return undefined
    }
    const parsed: unknown = JSON.parse(stored)
    return isSession(parsed) ? parsed : undefined
  } catch {
    // Invalid JSON or blocked storage both mean there is no usable session.
    return undefined
  }
}

export function writeSession(session: Session): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const { user, accessToken } = value as Partial<Session>
  return (
    typeof accessToken === 'string' &&
    accessToken !== '' &&
    typeof user === 'object' &&
    user !== null &&
    typeof user.username === 'string' &&
    typeof user.email === 'string'
  )
}
