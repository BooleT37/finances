import { testPrisma } from '../db/client';
import { testAuth } from '../db/testAuth';
import { expect, test } from '../fixtures';

// These specs drive the real login UI, so they clear the session cookie the
// `fixtures.ts` `context` fixture auto-injects for every other spec file.

test.describe('login', () => {
  test('signs in with valid credentials and redirects to transactions', async ({
    page,
    context,
  }) => {
    const project = await testPrisma.project.create({
      data: { name: 'Login Test Project' },
    });
    const password = 'login-test-password-123';
    await testAuth.api.createUser({
      body: {
        email: 'login-test@example.com',
        name: 'Login Test User',
        password,
        role: 'admin',
        data: { projectId: project.id, emailVerified: true },
      },
    });

    await context.clearCookies();
    await page.goto('/login');
    await page.getByLabel('Email').fill('login-test@example.com');
    await page.getByLabel('Пароль').fill(password);
    await page.getByRole('button', { name: 'Войти', exact: true }).click();
    await expect(page).toHaveURL(/\/transactions/);
  });

  test('shows an error for invalid credentials', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');
    await page.getByLabel('Email').fill('nonexistent@example.com');
    await page.getByLabel('Пароль').fill('wrong-password');
    await page.getByRole('button', { name: 'Войти', exact: true }).click();
    await expect(page.getByText('Неверный email или пароль')).toBeVisible();
  });

  test('redirects unauthenticated users to login', async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await page.goto('/transactions');
    await expect(page).toHaveURL(/\/login/);
  });

  test('language switcher changes the page language', async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await page.goto('/login');
    await expect(page.getByText('Вход', { exact: true })).toBeVisible();

    await page
      .getByLabel('Language switcher')
      .locator('input[value="en"]')
      .dispatchEvent('click');

    await expect(
      page.getByRole('heading', { name: 'Sign in', exact: true }),
    ).toBeVisible();
  });
});
