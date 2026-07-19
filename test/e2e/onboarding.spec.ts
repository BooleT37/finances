import { testPrisma } from './db/client';
import { TEST_USER_ID } from './db/seed';
import { expect, test } from './fixtures';

/** Re-opt the seeded user into the first-run tour (the seed marks it done). */
async function resetOnboarding() {
  await testPrisma.user.update({
    where: { id: TEST_USER_ID },
    data: { onboardingCompletedAt: null },
  });
}

test.describe('Onboarding tour', () => {
  test('first-run sequence runs from the nav settings group into the transactions page', async ({
    page,
  }) => {
    await resetOnboarding();
    await page.goto('/transactions');

    // Nav settings group auto-starts with the welcome step.
    await expect(page.getByText('Добро пожаловать!')).toBeVisible();

    // Step through the settings menu items — each one also navigates to its
    // page, so assert on the popover's unique body text (the title becomes
    // ambiguous once the breadcrumb shows the same word) and the URL.
    await page.getByRole('button', { name: 'Далее' }).click();
    await expect(
      page.getByText('Категории — основа всего приложения'),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/settings\/categories/);
    await page.getByRole('button', { name: 'Далее' }).click();
    await expect(page.getByText('Источники не обязательны')).toBeVisible();
    await expect(page).toHaveURL(/\/settings\/sources/);
    await page.getByRole('button', { name: 'Далее' }).click();
    await expect(
      page.getByText('Здесь будут находиться все ваши спотифаи'),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/settings\/subscriptions/);

    // Last settings step hands off to the transactions page.
    await page.getByRole('button', { name: 'К транзакциям' }).click();
    await expect(
      page.getByText('Здесь вводится список расходов и доходов'),
    ).toBeVisible();
  });

  test('skipping the sequence persists completion so it does not reappear', async ({
    page,
  }) => {
    await resetOnboarding();
    await page.goto('/transactions');

    await expect(page.getByText('Добро пожаловать!')).toBeVisible();
    // The skip control is rendered as an Anchor, not a button.
    await page.getByText('Пропустить').click();
    await expect(page.getByText('Добро пожаловать!')).not.toBeVisible();

    await expect
      .poll(async () => {
        const user = await testPrisma.user.findUniqueOrThrow({
          where: { id: TEST_USER_ID },
          select: { onboardingCompletedAt: true },
        });
        return user.onboardingCompletedAt !== null;
      })
      .toBe(true);
  });

  test('the breadcrumb help button starts a standalone tour that ends with Finish', async ({
    page,
  }) => {
    // Onboarding already complete (seed default) — no auto-start.
    await page.goto('/statistics');
    await expect(page.getByText('Добро пожаловать!')).not.toBeVisible();

    await page
      .getByRole('button', { name: 'Показать обзор этой страницы' })
      .click();
    // Assert on the popover's unique content, not the ambiguous title.
    await expect(
      page.getByText('Здесь вы можете сравнить, сколько вы потратили'),
    ).toBeVisible();
    // Standalone single-step tour ends with Finish, not a hand-off.
    await expect(page.getByRole('button', { name: 'Завершить' })).toBeVisible();
    await expect(page.getByText('Пропустить')).not.toBeVisible();
  });
});
