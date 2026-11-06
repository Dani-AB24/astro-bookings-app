import { useState, type FormEvent } from 'react'
import type { Launch } from '../api/types.ts'
import { FieldError, errorId } from '../components/field-error.tsx'
import buttonStyles from '../components/button.module.css'
import fieldStyles from '../components/form-field.module.css'
import { formatPrice, formatSeats } from '../utils/format.ts'
import styles from './booking-form.module.css'
import { checkSeatCount } from './seat-count.ts'

const INITIAL_SEATS = '1'

type BookingFormProps = {
  launch: Launch
  /** Disables the button while a booking is pending, which is what prevents a double charge. */
  isPending: boolean
  onBook: (seats: number) => void
  /** A seats error the API reported for the last attempt. */
  seatsError?: string
}

export function BookingForm({ launch, isPending, onBook, seatsError }: BookingFormProps) {
  // Keep the raw text so an empty field or a fraction can be detected, not coerced into a number.
  const [seatsText, setSeatsText] = useState(INITIAL_SEATS)
  const seatCount = checkSeatCount(seatsText, launch.availableSeats)
  const inputId = `booking-seats-${launch.id}`
  const fieldError = seatCount.valid ? seatsError : seatCount.message

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!seatCount.valid || isPending) {
      return
    }
    onBook(seatCount.seats)
  }

  return (
    <form aria-label="Book seats" className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={fieldStyles.field}>
        <label htmlFor={inputId} className={fieldStyles.label}>
          Seats
        </label>
        <input
          id={inputId}
          name="seats"
          type="number"
          inputMode="numeric"
          min={1}
          max={launch.availableSeats}
          step={1}
          value={seatsText}
          onChange={(event) => setSeatsText(event.target.value)}
          className={`${fieldStyles.input} ${styles.seats}`}
          aria-invalid={fieldError !== undefined}
          aria-describedby={fieldError === undefined ? undefined : errorId(inputId)}
        />
        <FieldError id={errorId(inputId)} message={fieldError} />
      </div>
      <button type="submit" className={`${buttonStyles.primary} ${styles.submitPlacement}`} disabled={!seatCount.valid || isPending}>
        {seatCount.valid ? `Book ${formatSeats(seatCount.seats)} for ${formatPrice(launch.price * seatCount.seats)}` : 'Book seats'}
      </button>
    </form>
  )
}
