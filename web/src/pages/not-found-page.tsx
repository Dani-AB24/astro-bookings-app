import { Link } from 'react-router-dom'
import buttonStyles from '../components/button.module.css'
import styles from './not-found-page.module.css'

export function NotFoundPage() {
  return (
    <section className={styles.page}>
      <h1>Page not found</h1>
      <p className={styles.message}>There is nothing at this address.</p>
      <p>
        <Link to="/" className={buttonStyles.secondary}>
          Back to the home page
        </Link>
      </p>
    </section>
  )
}
