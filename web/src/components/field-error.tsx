import styles from './form-field.module.css'

/** An error message that the related input names in its aria-describedby. */
export function FieldError({ id, message }: { id: string; message: string | undefined }) {
  return message === undefined ? null : (
    <p id={id} className={styles.error}>
      {message}
    </p>
  )
}

export function errorId(fieldId: string): string {
  return `${fieldId}-error`
}
