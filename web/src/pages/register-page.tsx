import { useMutation } from '@tanstack/react-query'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { RegisterRequest } from '../api/types.ts'
import { useAuth } from '../auth/auth-context.ts'
import { useReturnState } from '../auth/return-location.ts'
import { FieldError, errorId } from '../components/field-error.tsx'
import { TextField } from '../components/text-field.tsx'
import { toFormErrors } from '../forms/form-errors.ts'
import styles from './auth-form.module.css'

const REGISTER_FIELDS = ['username', 'email', 'password', 'terms'] as const

export function RegisterPage() {
  const { register } = useAuth()
  const returnState = useReturnState()
  // RedirectIfLoggedIn moves on to the return page once the session is set.
  const mutation = useMutation({ mutationFn: register })
  const errors = mutation.isError ? toFormErrors(mutation.error, REGISTER_FIELDS) : { fields: {} }
  const termsError = errors.fields.terms

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    mutation.mutate(readRegistration(new FormData(event.currentTarget)))
  }

  return (
    <section className={styles.page}>
      <h1>Create an account</h1>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {errors.form === undefined ? null : (
          <p role="alert" className={styles.formError}>
            {errors.form}
          </p>
        )}
        <TextField id="register-username" label="Username" name="username" autoComplete="username" error={errors.fields.username} />
        <TextField id="register-email" label="Email" name="email" type="email" autoComplete="email" error={errors.fields.email} />
        <TextField
          id="register-password"
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          error={errors.fields.password}
        />
        <div className={styles.terms}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="terms"
              aria-invalid={termsError !== undefined}
              aria-describedby={termsError === undefined ? undefined : errorId('register-terms')}
            />
            I accept the terms
          </label>
          <FieldError id={errorId('register-terms')} message={termsError} />
        </div>
        <button type="submit" className={styles.submit} disabled={mutation.isPending}>
          Register
        </button>
      </form>
      <p className={styles.alternative}>
        Already have an account? <Link to="/login" state={returnState}>Log in</Link>
      </p>
    </section>
  )
}

function readRegistration(formData: FormData): RegisterRequest {
  return {
    username: String(formData.get('username') ?? ''),
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
    terms: formData.get('terms') === 'on',
  }
}
