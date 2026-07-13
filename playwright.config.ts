import { defineConfig, devices } from '@playwright/test';

import {
  TEST_BASE_URL,
  TEST_BETTER_AUTH_SECRET,
  TEST_DB_URL,
} from './test/e2e/db/client';

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  globalSetup: './test/e2e/global-setup.ts',
  globalTeardown: './test/e2e/global-teardown.ts',
  workers: 1, // sequential spec files — parallel workers would race to reset the same DB
  use: {
    baseURL: TEST_BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 3001',
    url: TEST_BASE_URL,
    reuseExistingServer: false, // always fresh — tests must use the test DB, not the dev DB
    env: {
      DATABASE_URL: TEST_DB_URL,
      NODE_ENV: 'test',
      BETTER_AUTH_SECRET: TEST_BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: TEST_BASE_URL,
      // Explicitly clear: child processes inherit the parent's full env, so
      // a local .env's BETTER_AUTH_ALLOWED_HOSTS (e.g. "localhost:3002,...")
      // would otherwise leak in and reject this server's own port (3001)
      // since it's not in that list. auth.ts's .filter(Boolean) treats ''
      // the same as unset, falling back to BETTER_AUTH_URL above.
      BETTER_AUTH_ALLOWED_HOSTS: '',
    },
  },
});
