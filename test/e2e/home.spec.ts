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
    await expect(page.getByRole('link', { name: 'Сбережения' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Статистика' })).toBeVisible();
  });

  test('shows month navigator on Transactions, hides on Savings', async ({
    page,
  }) => {
    await expect(page).toHaveURL('/transactions');
    await expect(page.getByRole('button', { name: 'Previous' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();

    await page.getByRole('link', { name: 'Сбережения' }).click();
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

  test('language switcher choice persists across reload', async ({ page }) => {
    await page
      .getByLabel('Language switcher')
      .locator('input[value="en"]')
      .dispatchEvent('click');
    await expect(
      page.getByRole('link', { name: 'Transactions' }),
    ).toBeVisible();

    await page.goto('/');

    await expect(
      page.getByRole('link', { name: 'Transactions' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Планирование' })).toHaveCount(
      0,
    );
  });
});

test.describe('Month navigator cross-tab behavior', () => {
  test('changing the month in one tab does not affect another tab, but persists on reload', async ({
    page,
    context,
  }) => {
    await page.goto('/transactions');

    const monthLabel = page.getByRole('button', { name: 'Апрель 2024' });
    await expect(monthLabel).toBeVisible();

    const page2 = await context.newPage();
    await page2.goto('/transactions');
    await page2.waitForLoadState('networkidle');
    const monthLabel2 = page2.getByRole('button', { name: 'Апрель 2024' });
    await expect(monthLabel2).toBeVisible();

    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('button', { name: 'Май 2024' })).toBeVisible();

    await expect(monthLabel2).toBeVisible();

    await page2.goto('/transactions');
    await page2.waitForLoadState('networkidle');
    await expect(page2.getByRole('button', { name: 'Май 2024' })).toBeVisible();

    await page2.close();
  });
});

test.describe('Language prefill from browser locale', () => {
  test.use({ locale: 'en-US' });

  test('prefills from the browser locale when there is no saved language', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(
      page.getByRole('link', { name: 'Transactions' }),
    ).toBeVisible();
  });
});
