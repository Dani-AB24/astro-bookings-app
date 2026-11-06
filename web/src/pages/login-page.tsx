import { useMutation } from '@tanstack/react-query'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { LoginRequest } from '../api/types.ts'
import { useAuth } from '../auth/auth-context.ts'
import { useReturnState } from '../auth/return-location.ts'
import { TextField } from '../components/text-field.tsx'
import { toFormErrors } from '../forms/form-errors.ts'
import buttonStyles from '../components/button.module.css'
import styles from './auth-form.module.css'

const LOGIN_FIELDS = ['email', 'password'] as const

export function LoginPage() {
  const { login, sessionExpired } = useAuth()
  const returnState = useReturnState()
  // RedirectIfLoggedIn moves on to the return page once the session is set.
  const mutation = useMutation({ mutationFn: login })
  const errors = mutation.isError ? toFormErrors(mutation.error, LOGIN_FIELDS) : { fields: {} }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    mutation.mutate(readCredentials(new FormData(event.currentTarget)))
  }

  return (
    <section className={styles.page}>
      <h1>Log in</h1>
      {sessionExpired ? (
        <p role="status" className={styles.notice}>
          Your session has expired. Please log in again.
        </p>
      ) : null}
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {errors.form === undefined ? null : (
          <p role="alert" className={styles.formError}>
            {errors.form}
          </p>
        )}
        <TextField id="login-email" label="Email" name="email" type="email" autoComplete="email" error={errors.fields.email} />
        <TextField
          id="login-password"
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          error={errors.fields.password}
        />
        <button type="submit" className={buttonStyles.primary} disabled={mutation.isPending}>
          Log in
        </button>
      </form>
      <p className={styles.alternative}>
        New to AstroBookings? <Link to="/register" state={returnState}>Create an account</Link>
      </p>
    </section>
  )
}

function readCredentials(formData: FormData): LoginRequest {
  return {
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  }
}
