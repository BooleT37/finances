import { expect, test } from './fixtures';

test.describe('Project users', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings/users');
  });

  test('shows the seeded admin, resets passwords (self vs. other), adds a user, and removes a non-admin user', async ({
    page,
  }) => {
    const adminRow = page.locator('tr', { hasText: 'test-admin@example.com' });
    await expect(adminRow).toBeVisible();
    await expect(adminRow.getByText('Админ')).toBeVisible();

    // Resetting your own password shows a simplified label, not the
    // "share this with them" copy meant for other users.
    await adminRow.getByRole('button', { name: 'Сбросить пароль' }).click();
    const selfResetDialog = page.getByRole('dialog');
    await expect(
      selfResetDialog.getByText('Введите новый пароль'),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(selfResetDialog).not.toBeVisible();

    // Add a new (non-admin) user
    await page.getByRole('button', { name: 'Добавить пользователя' }).click();
    const addDialog = page.getByRole('dialog');
    await addDialog.getByLabel('Имя').fill('QA New User');
    await addDialog.getByLabel('Email').fill('qa-new-user@example.com');
    await addDialog.getByLabel('Временный пароль').fill('temp-password-123');
    await addDialog.getByRole('button', { name: 'Сохранить' }).click();

    const newUserRow = page.locator('tr', {
      hasText: 'qa-new-user@example.com',
    });
    await expect(newUserRow).toBeVisible();
    await expect(newUserRow.getByText('Пользователь')).toBeVisible();

    // Resetting someone else's password shows the full share-this-password copy
    await newUserRow.getByRole('button', { name: 'Сбросить пароль' }).click();
    const otherResetDialog = page.getByRole('dialog');
    await expect(
      otherResetDialog.getByText(/Сообщите этот пароль пользователю напрямую/),
    ).toBeVisible();
    await page.keyboard.press('Escape');

    // Remove the new user
    await newUserRow.getByRole('button', { name: 'Удалить' }).click();
    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog.getByText('Удалить пользователя')).toBeVisible();
    await confirmDialog
      .getByRole('button', { name: 'Удалить', exact: true })
      .click();

    await expect(newUserRow).not.toBeVisible();
    await expect(page.getByText('«QA New User» удалён')).toBeVisible();
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
