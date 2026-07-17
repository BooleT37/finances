import { testPrisma } from './db/client';
import { testAuth } from './db/testAuth';
import { expect, test } from './fixtures';

test.describe('Account settings', () => {
  test('updates the display name', async ({ page }) => {
    await page.goto('/settings/account');

    const nameInput = page.getByLabel('Имя');
    await expect(nameInput).toHaveValue('Test Admin');
    await nameInput.fill('Updated Admin Name');
    await page.getByRole('button', { name: 'Сохранить' }).click();
    await expect(page.getByText('Имя обновлено')).toBeVisible();

    await page.reload();
    await expect(page.getByLabel('Имя')).toHaveValue('Updated Admin Name');
  });

  test('rejects the wrong current password; changes it with the right one, and the new password signs in', async ({
    page,
    context,
  }) => {
    const project = await testPrisma.project.create({
      data: { name: 'Change Password Test Project' },
    });
    const email = 'change-password-test@example.com';
    const currentPassword = 'current-password-123';
    await testAuth.api.createUser({
      body: {
        email,
        name: 'Change Password Test User',
        password: currentPassword,
        role: 'admin',
        data: { projectId: project.id, emailVerified: true },
      },
    });

    await context.clearCookies();
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Пароль').fill(currentPassword);
    await page.getByRole('button', { name: 'Войти', exact: true }).click();
    await expect(page).toHaveURL(/\/transactions/);

    await page.goto('/settings/account');
    const newPassword = 'new-password-456';
    await page.getByLabel('Текущий пароль').fill('wrong-password');
    await page.getByLabel(/^Новый пароль/).fill(newPassword);
    await page.getByLabel('Повторите новый пароль').fill(newPassword);
    await page.getByRole('button', { name: 'Сменить пароль' }).click();
    await expect(page.getByText('Неверный текущий пароль')).toBeVisible();

    await page.getByLabel('Текущий пароль').fill(currentPassword);
    await page.getByRole('button', { name: 'Сменить пароль' }).click();
    await expect(page.getByText('Пароль изменён')).toBeVisible();

    await page.getByRole('button', { name: 'Выйти' }).click();
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Пароль').fill(newPassword);
    await page.getByRole('button', { name: 'Войти', exact: true }).click();
    await expect(page).toHaveURL(/\/transactions/);
  });
});
