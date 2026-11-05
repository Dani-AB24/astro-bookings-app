import { ApiError } from '../api/api-error.ts'

export type FormErrors<Field extends string> = {
  /** Errors the API reported for a field on this form, keyed by that field. */
  fields: Partial<Record<Field, string>>
  /** An error that belongs to no field on the form, such as a wrong password. */
  form?: string
}

const UNEXPECTED_ERROR_MESSAGE = 'Something went wrong. Please try again.'

/** Maps a failed request to messages for the form, keeping the API's own wording. */
export function toFormErrors<Field extends string>(
  error: unknown,
  formFields: readonly Field[],
): FormErrors<Field> {
  if (!(error instanceof ApiError)) {
    return { fields: {}, form: UNEXPECTED_ERROR_MESSAGE }
  }

  const fields: Partial<Record<Field, string>> = {}
  const otherMessages: string[] = []
  for (const fieldError of error.errors) {
    if (isFormField(fieldError.field, formFields)) {
      fields[fieldError.field] ??= fieldError.message
    } else {
      otherMessages.push(fieldError.message)
    }
  }

  const hasFieldErrors = Object.keys(fields).length > 0
  if (otherMessages.length > 0) {
    return { fields, form: otherMessages.join(' ') }
  }
  return hasFieldErrors ? { fields } : { fields, form: error.message }
}

function isFormField<Field extends string>(field: string, formFields: readonly Field[]): field is Field {
  return (formFields as readonly string[]).includes(field)
}
