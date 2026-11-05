import { useLocation, type Location } from 'react-router-dom'

/** Router state that carries the page to return to after logging in or registering. */
export type ReturnState = {
  from: string
}

const DEFAULT_RETURN_PATH = '/'

export function toReturnState(location: Location): ReturnState {
  return { from: `${location.pathname}${location.search}${location.hash}` }
}

/**
 * The page to show once the person is logged in. Router state cannot be set by a crafted link,
 * so it needs no validation; a hard reload loses it and falls back to the home page.
 */
export function useReturnPath(): string {
  const { state } = useLocation()
  return isReturnState(state) ? state.from : DEFAULT_RETURN_PATH
}

/** Keeps the return page when moving between the login and registration pages. */
export function useReturnState(): ReturnState | undefined {
  const { state } = useLocation()
  return isReturnState(state) ? state : undefined
}

function isReturnState(state: unknown): state is ReturnState {
  return typeof state === 'object' && state !== null && typeof (state as ReturnState).from === 'string'
}
