import { testPrisma } from './db/client';
import { TEST_PROJECT_ID, TEST_USER_ID } from './db/seed';
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

  test('a member does not see the switch', async ({ page }) => {
    await testPrisma.user.update({
      where: { id: TEST_USER_ID },
      data: { role: 'user' },
    });
    await page.goto('/settings/project');

    await expect(
      page.getByRole('heading', { name: 'Пользователи проекта' }),
    ).toBeVisible();
    await expect(page.getByRole('switch', { name: SWITCH_LABEL })).toHaveCount(
      0,
    );
  });
});
