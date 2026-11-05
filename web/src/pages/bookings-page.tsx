import styles from './bookings-page.module.css'

// Temporary protected page; view-bookings replaces it.
export function BookingsPage() {
  return (
    <section className={styles.page}>
      <h1>My bookings</h1>
      <p className={styles.message}>Your bookings will appear here soon.</p>
    </section>
  )
}
