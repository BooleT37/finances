import { test, expect } from './fixtures';

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders in Russian and switches to English', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Финансы' })).toBeVisible();
    await expect(page.getByText('Личный финансовый инструмент')).toBeVisible();
    await expect(page.getByLabel('Language switcher')).toBeVisible();

    // Mantine hides radio inputs behind labels; dispatchEvent bypasses hit-testing
    // and fires the click event that Mantine's internal handler uses to call onChange.
    await page
      .getByLabel('Language switcher')
      .locator('input[value="en"]')
      .dispatchEvent('click');
    await expect(page.getByRole('heading', { name: 'Finances' })).toBeVisible();
  });
});
