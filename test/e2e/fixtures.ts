import { test as base, expect } from '@playwright/test';

import { resetDb } from './db/reset';
import type { SeedData } from './db/seed';

export type { SeedData };

// Extend the base `page` fixture so that every page.goto() automatically
// waits for networkidle before returning. This ensures Vite's module requests
// have settled and Mantine/React event handlers are fully attached.
//
// `seedData` is test-scoped and auto-used: it truncates all data and
// re-seeds before each test. Tests that need seeded IDs can destructure
// `{ seedData }` from `test`.
//
// The seeded session's cookie is injected into every test's browser context
// so specs land straight on authenticated pages without going through the
// login form. Specs that need to exercise the real login UI (test/e2e/auth/)
// should not rely on this — see login.spec.ts, which clears cookies first.
export const test = base.extend<{ seedData: SeedData }>({
  seedData: [
    async ({}, use) => {
      const data = await resetDb();
      await use(data);
    },
    { auto: true },
  ],

  context: async ({ context, seedData }, use) => {
    await context.addCookies(seedData.sessionCookies);
    await use(context);
  },

  page: async ({ page }, use) => {
    const originalGoto = page.goto.bind(page);
    page.goto = async (url, options) => {
      const response = await originalGoto(url, options);
      await page.waitForLoadState('networkidle');
      return response;
    };
    await use(page);
  },
});

export { expect };
