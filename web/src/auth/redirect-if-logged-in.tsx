import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './auth-context.ts'
import { useReturnPath } from './return-location.ts'

/**
 * Wraps the login and registration pages. It sends people who are logged in on to their return page,
 * which also completes a successful login or registration.
 */
export function RedirectIfLoggedIn() {
  const { user } = useAuth()
  const returnPath = useReturnPath()

  return user === undefined ? <Outlet /> : <Navigate to={returnPath} replace />
}
