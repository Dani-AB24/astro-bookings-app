import { Link, Outlet } from 'react-router-dom'
import { ApiStatusNotice } from './api-status-notice.tsx'
import styles from './app-layout.module.css'

export function AppLayout() {
  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link to="/" className={styles.brand}>
            AstroBookings
          </Link>
        </div>
      </header>
      <ApiStatusNotice />
      <main className={styles.main}>
        <Outlet />
      </main>
    </>
  )
}
