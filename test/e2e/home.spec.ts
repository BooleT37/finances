import { test, expect } from './fixtures';

test.describe('App shell', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('redirects / to /transactions and shows navigation', async ({
    page,
  }) => {
    await expect(page).toHaveURL('/transactions');
    await expect(page.getByRole('link', { name: 'Транзакции' })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Планирование' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Накопления' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Статистика' })).toBeVisible();
  });

  test('shows month navigator on Transactions, hides on Savings', async ({
    page,
  }) => {
    await expect(page).toHaveURL('/transactions');
    await expect(page.getByRole('button', { name: 'Previous' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();

    await page.getByRole('link', { name: 'Накопления' }).click();
    await expect(page).toHaveURL('/savings-spendings');
    await expect(
      page.getByRole('button', { name: 'Previous' }),
    ).not.toBeVisible();
  });

  test('language switcher changes nav labels', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Транзакции' })).toBeVisible();
    await expect(page.getByLabel('Language switcher')).toBeVisible();

    // Mantine hides radio inputs behind labels; dispatchEvent bypasses hit-testing
    // and fires the click event that Mantine's internal handler uses to call onChange.
    await page
      .getByLabel('Language switcher')
      .locator('input[value="en"]')
      .dispatchEvent('click');

    await expect(
      page.getByRole('link', { name: 'Transactions' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Planning' })).toBeVisible();
  });
});
