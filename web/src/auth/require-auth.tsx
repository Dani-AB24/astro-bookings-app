import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './auth-context.ts'
import { toReturnState } from './return-location.ts'

/** Wraps routes that need an account, sending anonymous visitors to log in first. */
export function RequireAuth() {
  const { user } = useAuth()
  const location = useLocation()

  return user === undefined ? <Navigate to="/login" replace state={toReturnState(location)} /> : <Outlet />
}
