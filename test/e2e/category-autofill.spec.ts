import { testPrisma } from './db/client';
import { TEST_PROJECT_ID } from './db/seed';
import { testAuth } from './db/testAuth';
import { expect, test } from './fixtures';

const SWITCH_LABEL = 'Автозаполнение категорий';

test.describe('Category autofill', () => {
  test('is off for a new project, and an admin can turn it on', async ({
    page,
  }) => {
    await page.goto('/settings/project');

    const autofillSwitch = page.getByRole('switch', { name: SWITCH_LABEL });
    await expect(autofillSwitch).not.toBeChecked();
    await expect(autofillSwitch).toBeEnabled();

    await autofillSwitch.click();
    await expect(
      page.getByText('Автозаполнение категорий включено'),
    ).toBeVisible();
    await expect(autofillSwitch).toBeChecked();

    await page.reload();
    await expect(
      page.getByRole('switch', { name: SWITCH_LABEL }),
    ).toBeChecked();

    const setting = await testPrisma.projectSetting.findUniqueOrThrow({
      where: { projectId: TEST_PROJECT_ID },
    });
    expect(setting.categorySuggestionsEnabledAt).not.toBeNull();
  });

  test('an admin can turn it off again', async ({ page }) => {
    await testPrisma.projectSetting.update({
      where: { projectId: TEST_PROJECT_ID },
      data: { categorySuggestionsEnabledAt: new Date() },
    });
    await page.goto('/settings/project');

    await page.getByRole('switch', { name: SWITCH_LABEL }).click();
    await expect(
      page.getByText('Автозаполнение категорий выключено'),
    ).toBeVisible();

    const setting = await testPrisma.projectSetting.findUniqueOrThrow({
      where: { projectId: TEST_PROJECT_ID },
    });
    expect(setting.categorySuggestionsEnabledAt).toBeNull();
  });

  test('a non-admin sees the switch but cannot change it', async ({
    page,
    context,
  }) => {
    const email = 'category-autofill-non-admin@example.com';
    const password = 'non-admin-password-123';
    await testAuth.api.createUser({
      body: {
        email,
        name: 'Non-Admin User',
        password,
        role: 'user',
        data: { projectId: TEST_PROJECT_ID, emailVerified: true },
      },
    });
    await testPrisma.user.update({
      where: { email },
      data: { onboardingCompletedAt: new Date() },
    });

    await context.clearCookies();
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Пароль').fill(password);
    await page.getByRole('button', { name: 'Войти', exact: true }).click();
    await expect(page).toHaveURL(/\/transactions/);

    await page.goto('/settings/project');
    await expect(
      page.getByRole('switch', { name: SWITCH_LABEL }),
    ).toBeDisabled();
    await expect(
      page.getByText('Изменить это может только администратор.'),
    ).toBeVisible();
  });
});
