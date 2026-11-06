import { Link, Outlet } from 'react-router-dom'
import { SessionExpiredRedirect } from '../auth/session-expired-redirect.tsx'
import { ApiStatusNotice } from './api-status-notice.tsx'
import styles from './app-layout.module.css'
import { SessionNav } from './session-nav.tsx'

export function AppLayout() {
  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link to="/" className={styles.brand}>
            AstroBookings
          </Link>
          <SessionNav />
        </div>
      </header>
      <SessionExpiredRedirect />
      <ApiStatusNotice />
      <main className={styles.main}>
        <Outlet />
      </main>
    </>
  )
}
