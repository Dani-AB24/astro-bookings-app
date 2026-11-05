// Hand-written to match the API; add only what the client uses.

export type ApiFieldError = {
  field: string
  message: string
}

export type ApiErrorBody = {
  message: string
  errors?: ApiFieldError[]
}

export type HealthResponse = {
  status: string
}

/** The user as auth responses return it. `id` is a number here, unlike the string `userId` on bookings. */
export type AuthUser = {
  id: number
  username: string
  email: string
  terms: boolean
}

export type AuthResponse = {
  user: AuthUser
  accessToken: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  username: string
  email: string
  password: string
  terms: boolean
}
