import { testPrisma } from './db/client';
import { expect, test } from './fixtures';

test.describe('Project users', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings/project');
  });

  test('shows the seeded admin, adds a user via a one-time generated password, and removes a non-admin user', async ({
    page,
    seedData,
  }) => {
    const adminRow = page.locator('tr', { hasText: 'test-admin@example.com' });
    await expect(adminRow).toBeVisible();
    await expect(adminRow.getByText('Админ')).toBeVisible();

    // Password/name changes live on the dedicated Account page, not here.
    await expect(
      adminRow.getByRole('button', { name: 'Сменить пароль' }),
    ).toHaveCount(0);

    // Add a new (non-admin) user — no password field, the server generates one.
    await page.getByRole('button', { name: 'Добавить пользователя' }).click();
    const addDialog = page.getByRole('dialog');
    await addDialog.getByLabel('Имя').fill('QA New User');
    await addDialog.getByLabel('Email').fill('qa-new-user@example.com');
    await addDialog.getByRole('button', { name: 'Сохранить' }).click();

    // Success view shows the generated password once, and can't be
    // dismissed accidentally via click-outside/Escape.
    const createdDialog = page.getByRole('dialog');
    await expect(
      createdDialog.getByText('Пользователь добавлен'),
    ).toBeVisible();
    const passwordField = createdDialog.getByLabel('Временный пароль');
    await expect(passwordField).not.toHaveValue('');
    await page.keyboard.press('Escape');
    await expect(createdDialog).toBeVisible();

    await createdDialog.getByRole('button', { name: 'Готово' }).click();
    await expect(createdDialog).not.toBeVisible();

    const newUserRow = page.locator('tr', {
      hasText: 'qa-new-user@example.com',
    });
    await expect(newUserRow).toBeVisible();
    await expect(newUserRow.getByText('Пользователь')).toBeVisible();

    const newUser = await testPrisma.user.findUniqueOrThrow({
      where: { email: 'qa-new-user@example.com' },
    });
    expect(newUser.createdById).toBe(seedData.userId);

    const session = await (
      await page.request.get('/api/auth/get-session')
    ).json();
    expect(session.user).not.toHaveProperty('createdById');

    // A user who has created rows must still be removable.
    const categoryId = seedData.categoryIds.продукты;
    await testPrisma.category.update({
      where: { id: categoryId },
      data: { createdById: newUser.id, updatedById: newUser.id },
    });

    // Remove the new user
    await newUserRow.getByRole('button', { name: 'Удалить' }).click();
    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog.getByText('Удалить пользователя')).toBeVisible();
    await confirmDialog
      .getByRole('button', { name: 'Удалить', exact: true })
      .click();

    await expect(newUserRow).not.toBeVisible();
    await expect(page.getByText('«QA New User» удалён')).toBeVisible();

    const category = await testPrisma.category.findUniqueOrThrow({
      where: { id: categoryId },
    });
    expect(category.createdById).toBeNull();
    expect(category.updatedById).toBeNull();
  });

  test("blocks removing the project's last admin", async ({ page }) => {
    const adminRow = page.locator('tr', { hasText: 'test-admin@example.com' });

    await adminRow.getByRole('button', { name: 'Удалить' }).click();
    const confirmDialog = page.getByRole('dialog');
    await confirmDialog
      .getByRole('button', { name: 'Удалить', exact: true })
      .click();

    // Deletion is rejected server-side (last admin) — the row must remain.
    await expect(adminRow).toBeVisible();
  });
});
