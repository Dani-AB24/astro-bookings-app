import styles from './loading-message.module.css'

export function LoadingMessage({ children }: { children: string }) {
  return (
    <p role="status" className={styles.loading}>
      {children}
    </p>
  )
}
