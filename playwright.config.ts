import { defineConfig, devices } from '@playwright/test';

import { TEST_DB_URL } from './test/e2e/db/client';

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
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: false, // always fresh — tests must use the test DB, not the dev DB
    env: { DATABASE_URL: TEST_DB_URL, NODE_ENV: 'test' },
  },
});
