import { expect, test } from './fixtures';

test.describe('Categories inline editing', () => {
  test('editing name inline updates the table and syncs the open sidebar form', async ({
    page,
  }) => {
    await page.goto('/settings/categories');

    const row = page.locator('tr', { hasText: 'Продукты' });
    // Once the cell enters edit mode, the name moves from text content into
    // an input's value, so a `hasText`-based row locator stops matching on
    // re-evaluation. Scope the input to the table instead, which is stable
    // across the edit-mode transition — the sidebar form lives outside it.
    const table = page.locator('table');

    // Open the sidebar on this same category so we can verify the inline
    // edit keeps it in sync, not just the table.
    await row.getByRole('button', { name: 'Редактировать' }).click();
    const form = page.getByRole('form', { name: 'Форма категории' });
    // "Краткое название" also contains "название" as a substring and the
    // sidebar's own required field renders its accessible name with a
    // trailing " *", so scope by Mantine's data-path instead of the label.
    const sidebarName = form.locator('[data-path="name"]');
    await expect(sidebarName).toHaveValue('Продукты');

    await row.getByText('Продукты').click();
    await table
      .getByRole('textbox', { name: 'Название', exact: true })
      .fill('Продукты 2');
    await page.keyboard.press('Enter');

    await expect(row.getByText('Продукты 2')).toBeVisible();
    await expect(sidebarName).toHaveValue('Продукты 2');
  });

  test('clicking outside the input saves the edit', async ({ page }) => {
    await page.goto('/settings/categories');

    const row = page.locator('tr', { hasText: 'Транспорт' });
    const table = page.locator('table');

    await row.getByText('Транспорт').click();
    await table
      .getByRole('textbox', { name: 'Название', exact: true })
      .fill('Транспорт 2');
    // Click somewhere neutral to blur the input instead of pressing Enter.
    await page.locator('body').click({ position: { x: 10, y: 10 } });

    await expect(row.getByText('Транспорт 2')).toBeVisible();
  });
});
