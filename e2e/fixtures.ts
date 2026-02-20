import { test as base, expect } from '@playwright/test';

// Extend the base `page` fixture so that every page.goto() automatically
// waits for networkidle before returning. This ensures Vite's module requests
// have settled and Mantine/React event handlers are fully attached.
export const test = base.extend<object, object>({
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
