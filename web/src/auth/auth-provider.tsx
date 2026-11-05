import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { login as loginRequest, register as registerRequest } from '../api/client.ts'
import type { LoginRequest, RegisterRequest } from '../api/types.ts'
import { AuthContext, type AuthContextValue } from './auth-context.ts'
import { clearSession, readSession, writeSession, type Session } from './session.ts'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState(readSession)

  // Reset cached data on every session change, so one person's data never shows for the next.
  const changeSession = useCallback(
    (nextSession: Session | undefined) => {
      if (nextSession === undefined) {
        clearSession()
      } else {
        writeSession(nextSession)
      }
      setSession(nextSession)
      void queryClient.resetQueries()
    },
    [queryClient],
  )

  const login = useCallback(
    async (credentials: LoginRequest) => changeSession(await loginRequest(credentials)),
    [changeSession],
  )
  const register = useCallback(
    async (details: RegisterRequest) => changeSession(await registerRequest(details)),
    [changeSession],
  )
  const logout = useCallback(() => changeSession(undefined), [changeSession])

  const value = useMemo<AuthContextValue>(
    () => ({ user: session?.user, login, register, logout }),
    [session, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
