import { FieldError, errorId } from './field-error.tsx'
import styles from './form-field.module.css'

type TextFieldProps = {
  id: string
  label: string
  name: string
  type?: 'text' | 'email' | 'password'
  autoComplete?: string
  error: string | undefined
}

export function TextField({ id, label, name, type = 'text', autoComplete, error }: TextFieldProps) {
  const hasError = error !== undefined
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        className={styles.input}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId(id) : undefined}
      />
      <FieldError id={errorId(id)} message={error} />
    </div>
  )
}
