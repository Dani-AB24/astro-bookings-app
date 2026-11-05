import styles from './home-page.module.css'

// Temporary home page; list-launches replaces its content.
export function HomePage() {
  return (
    <section className={styles.page}>
      <h1>Welcome to AstroBookings</h1>
      <p className={styles.lead}>Book your seat on an upcoming rocket launch.</p>
    </section>
  )
}
