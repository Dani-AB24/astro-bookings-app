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
