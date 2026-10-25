import { expect, test } from './fixtures';

// The legal pages must open for visitors who aren't signed in (Enable Banking
// and prospective users reach them that way), so every spec here clears the
// session cookie the `fixtures.ts` `context` fixture injects.

test.describe('Legal pages', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('the privacy policy opens signed out', async ({ page }) => {
    await page.goto('/privacy');

    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page).toHaveTitle('Privacy Policy');
    await expect(
      page.getByRole('heading', { name: 'Privacy Policy', level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'aide.service.37@gmail.com' }).first(),
    ).toHaveAttribute('href', 'mailto:aide.service.37@gmail.com');
  });

  test('the terms of service open signed out', async ({ page }) => {
    await page.goto('/terms');

    await expect(page).toHaveURL(/\/terms$/);
    await expect(page).toHaveTitle('Terms of Service');
    await expect(
      page.getByRole('heading', { name: 'Terms of Service', level: 1 }),
    ).toBeVisible();
  });

  test('the login page links to both pages, and they link back', async ({
    page,
  }) => {
    await page.goto('/login');

    await page.getByRole('link', { name: 'Условия использования' }).click();
    await expect(page).toHaveURL(/\/terms$/);
    await page.getByRole('link', { name: 'Back to sign in' }).click();
    await expect(page).toHaveURL(/\/login/);

    await page
      .getByRole('link', { name: 'Политика конфиденциальности' })
      .click();
    await expect(page).toHaveURL(/\/privacy$/);
  });
});
