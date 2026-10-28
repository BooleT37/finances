import { generateKeyPairSync } from 'node:crypto';

import { defineConfig, devices } from '@playwright/test';

import {
  TEST_BASE_URL,
  TEST_BETTER_AUTH_SECRET,
  TEST_DB_URL,
} from './test/e2e/db/client';
import { TEST_PROJECT_ID } from './test/e2e/db/seed';
import { ENABLE_BANKING_STUB_URL } from './test/e2e/stubs/enableBankingStub';

// A throwaway key: the stub doesn't check the signature, it only has to exist.
const { privateKey: enableBankingKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

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
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    // The app now prefills its language from the browser's locale when there's
    // no saved preference. Pin it to Russian — the app's default — so specs
    // asserting Russian text don't depend on the host machine's locale.
    locale: 'ru-RU',
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
    ignoreHTTPSErrors: true,
    reuseExistingServer: false, // always fresh — tests must use the test DB, not the dev DB
    env: {
      DATABASE_URL: TEST_DB_URL,
      NODE_ENV: 'test',
      BETTER_AUTH_SECRET: TEST_BETTER_AUTH_SECRET,
      // Dummy values, not meant to work — Better Auth only warns
      // ("Social provider google is missing clientId or clientSecret") when
      // clientId is falsy (see create-context.mjs), it doesn't validate the
      // credential. No test exercises real Google sign-in.
      GOOGLE_CLIENT_ID: 'test-google-client-id',
      GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
      // Overrides (not clears): child processes inherit the parent's full
      // env, so a local .env's BETTER_AUTH_ALLOWED_HOSTS (e.g.
      // "localhost:3002,...") would otherwise leak in and reject this
      // server's own port (3001) since it's not in that list.
      BETTER_AUTH_ALLOWED_HOSTS: 'localhost:3001',
      // Bank import talks to a local stub instead of Enable Banking, see
      // test/e2e/stubs/enableBankingStub.ts.
      ENABLE_BANKING_APP_ID: 'e2e-app',
      ENABLE_BANKING_PRIVATE_KEY: enableBankingKey
        .export({ type: 'pkcs8', format: 'pem' })
        .toString(),
      ENABLE_BANKING_PROJECT_ID: TEST_PROJECT_ID,
      ENABLE_BANKING_API_URL: ENABLE_BANKING_STUB_URL,
    },
  },
});
