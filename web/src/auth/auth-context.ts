import { createContext, useContext } from 'react'
import type { AuthUser, LoginRequest, RegisterRequest } from '../api/types.ts'

export type AuthContextValue = {
  /** The logged-in user, or nothing for an anonymous visitor. */
  user: AuthUser | undefined
  login: (credentials: LoginRequest) => Promise<void>
  register: (details: RegisterRequest) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (value === undefined) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return value
}
