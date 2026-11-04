import { defineConfig } from '@playwright/test';

const TEST_PORT = 3100;
const BASE_URL = `http://localhost:${TEST_PORT}`;

export default defineConfig({
  testDir: './tests',
  reporter: 'list',
  use: { baseURL: BASE_URL },
  webServer: {
    command: 'npx tsx tests/support/start-test-server.ts',
    url: `${BASE_URL}/health`,
    env: { PORT: String(TEST_PORT) },
    reuseExistingServer: false,
    // Lets the test server remove its temp directory before it exits.
    gracefulShutdown: { signal: 'SIGTERM', timeout: 2000 },
  },
});
