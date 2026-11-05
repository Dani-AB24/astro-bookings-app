import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'

// These ports avoid clashes with normal development on 3000 (API) and 5173 (Vite).
const API_PORT = 3100
const WEB_PORT = 5174
const API_URL = `http://localhost:${API_PORT}`
const WEB_URL = `http://localhost:${WEB_PORT}`

export default defineConfig({
  testDir: './e2e',
  reporter: 'list',
  use: { baseURL: WEB_URL },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // Runs the API from a temporary copy of the seed data, so tests never touch local db/ files.
      command: 'npx tsx tests/support/start-test-server.ts',
      cwd: path.resolve(import.meta.dirname, '../api'),
      url: `${API_URL}/health`,
      env: { PORT: String(API_PORT) },
      reuseExistingServer: false,
      // Lets the test server remove its temp directory before it exits.
      gracefulShutdown: { signal: 'SIGTERM', timeout: 2000 },
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      url: WEB_URL,
      env: { VITE_API_URL: API_URL },
      reuseExistingServer: false,
    },
  ],
})
