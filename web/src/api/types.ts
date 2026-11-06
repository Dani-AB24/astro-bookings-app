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

export type LaunchStatus = 'draft' | 'published' | 'confirmed' | 'sold-out' | 'done' | 'cancelled'

/** A launch as `GET /launches` returns it. `availableSeats` is computed by the API, never stored. */
export type Launch = {
  id: string
  name: string
  rocket: string
  slug: string
  /** Price per seat. The API has no currency; the client shows it in US dollars. */
  price: number
  /** ISO date string. */
  date: string
  /** In minutes. */
  duration: number
  launchSite: string
  totalSeats: number
  availableSeats: number
  status: LaunchStatus
}

export type PaymentStatus = 'pending' | 'paid' | 'refunded'

export type CreateBookingRequest = {
  launchId: string
  seats: number
}

/** A booking as `POST /bookings` returns it: without the `launch` details that the GET routes add. */
export type Booking = {
  id: string
  launchId: string
  /** A string such as `user-1`, unlike the numeric `id` in auth responses. */
  userId: string
  seats: number
  createdAt: string
  paymentStatus: PaymentStatus
}

/** The launch details that the booking GET routes embed. They are the launch's current values, not those at booking time. */
export type BookingLaunch = Pick<Launch, 'name' | 'rocket' | 'slug' | 'price' | 'date' | 'duration' | 'launchSite' | 'status'>

/** A booking as `GET /bookings` returns it, with its launch's details. */
export type BookingWithLaunch = Booking & {
  launch: BookingLaunch
}
