import { testPrisma } from './db/client';
import { TEST_USER_ID } from './db/seed';
import { expect, test } from './fixtures';

test.describe('Project info', () => {
  test('admin can rename the project, and sees the users section on the same page', async ({
    page,
  }) => {
    await page.goto('/settings/project');

    await expect(
      page.getByRole('heading', { name: 'Проект E2E Test Project' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Пользователи проекта' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Переименовать проект' }).click();
    const nameInput = page.getByRole('textbox');
    await expect(nameInput).toHaveValue('E2E Test Project');
    await nameInput.fill('Renamed E2E Project');
    await page.getByRole('button', { name: 'Сохранить' }).click();
    await expect(page.getByText('Проект переименован')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Проект Renamed E2E Project' }),
    ).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Проект Renamed E2E Project' }),
    ).toBeVisible();
  });

  test('cancel button discards edits without renaming', async ({ page }) => {
    await page.goto('/settings/project');

    await page.getByRole('button', { name: 'Переименовать проект' }).click();
    await page.getByRole('textbox').fill('Should not be saved');
    await page.getByRole('button', { name: 'Отмена' }).click();

    await expect(
      page.getByRole('heading', { name: 'Проект E2E Test Project' }),
    ).toBeVisible();
    await expect(page.getByRole('textbox')).toHaveCount(0);
  });

  test('a member can rename the project too', async ({ page }) => {
    await testPrisma.user.update({
      where: { id: TEST_USER_ID },
      data: { role: 'user' },
    });
    await page.goto('/settings/project');

    await page.getByRole('button', { name: 'Переименовать проект' }).click();
    await page.getByRole('textbox').fill('Renamed by a member');
    await page.getByRole('button', { name: 'Сохранить' }).click();
    await expect(page.getByText('Проект переименован')).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Проект Renamed by a member' }),
    ).toBeVisible();
  });
});
