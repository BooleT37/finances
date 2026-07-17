import { TEST_PROJECT_ID } from './db/seed';
import { testAuth } from './db/testAuth';
import { expect, test } from './fixtures';

test.describe('Project info', () => {
  test('admin can rename the project, and sees the users section on the same page', async ({
    page,
  }) => {
    await page.goto('/settings/project');

    await expect(
      page.getByRole('heading', { name: 'Пользователи проекта' }),
    ).toBeVisible();

    const nameInput = page.getByLabel('Название проекта');
    await expect(nameInput).toHaveValue('E2E Test Project');
    await nameInput.fill('Renamed E2E Project');
    await page.getByRole('button', { name: 'Сохранить' }).click();
    await expect(page.getByText('Проект переименован')).toBeVisible();

    await page.reload();
    await expect(page.getByLabel('Название проекта')).toHaveValue(
      'Renamed E2E Project',
    );
  });

  test('non-admin sees the project name read-only, with no rename control', async ({
    page,
    context,
  }) => {
    const email = 'project-info-non-admin@example.com';
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

    await context.clearCookies();
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Пароль').fill(password);
    await page.getByRole('button', { name: 'Войти', exact: true }).click();
    await expect(page).toHaveURL(/\/transactions/);

    await page.goto('/settings/project');
    await expect(page.getByText('E2E Test Project')).toBeVisible();
    await expect(page.getByLabel('Название проекта')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Сохранить' })).toHaveCount(
      0,
    );

    // The users section is admin-only and shouldn't render at all for them.
    await expect(
      page.getByRole('heading', { name: 'Пользователи проекта' }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Добавить пользователя' }),
    ).toHaveCount(0);
  });
});
