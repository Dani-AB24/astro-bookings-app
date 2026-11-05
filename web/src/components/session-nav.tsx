import { startTransition } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context.ts'
import styles from './session-nav.module.css'

/** The layout's account area: log in and register for visitors, the username and logout for people logged in. */
export function SessionNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // The router renders navigations as transitions. Clearing the session in the same transition
  // renders both together, so a protected page never sees the logout and redirects to the login page.
  function handleLogout() {
    startTransition(() => {
      void navigate('/', { replace: true })
      logout()
    })
  }

  return (
    <nav aria-label="Account" className={styles.nav}>
      {user === undefined ? (
        <>
          <Link to="/login">Log in</Link>
          <Link to="/register">Register</Link>
        </>
      ) : (
        <>
          <span className={styles.username}>{user.username}</span>
          <Link to="/bookings">My bookings</Link>
          <button type="button" className={styles.logout} onClick={handleLogout}>
            Log out
          </button>
        </>
      )}
    </nav>
  )
}
