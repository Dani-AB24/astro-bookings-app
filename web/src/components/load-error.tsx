import buttonStyles from './button.module.css'
import styles from './load-error.module.css'

type LoadErrorProps = {
  message: string
  onRetry: () => void
  isRetrying: boolean
}

/** Explains that data could not be loaded and offers to try again. */
export function LoadError({ message, onRetry, isRetrying }: LoadErrorProps) {
  return (
    <div role="alert" className={styles.error}>
      <p>{message}</p>
      <button type="button" className={buttonStyles.secondary} onClick={onRetry} disabled={isRetrying}>
        Try again
      </button>
    </div>
  )
}
