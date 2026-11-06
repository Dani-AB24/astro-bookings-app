import { useEffect, useEffectEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './auth-context.ts'
import { toReturnState } from './return-location.ts'

/**
 * Sends people to log in when their session expires. The launch page is public, so RequireAuth
 * would not redirect from it. The current page goes in router state, so logging in returns there.
 */
export function SessionExpiredRedirect() {
  const { sessionExpired } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Reads the latest location without making every navigation re-run the effect.
  const redirectToLogin = useEffectEvent(() => {
    void navigate('/login', { state: toReturnState(location) })
  })

  useEffect(() => {
    if (sessionExpired) {
      redirectToLogin()
    }
  }, [sessionExpired])

  return null
}
