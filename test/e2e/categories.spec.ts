import { testPrisma } from './db/client';
import { expect, test } from './fixtures';

test.describe('Categories inline editing', () => {
  test('editing name inline updates the table and syncs the open sidebar form; removing a used subcategory keeps its transactions', async ({
    page,
    seedData,
  }) => {
    // Assign a transaction to the Рынок subcategory of Продукты, so removing
    // it below exercises the "keep the transaction, drop the link" path.
    const tx = await testPrisma.expense.create({
      data: {
        name: 'Овощи',
        cost: 12,
        date: new Date('2024-04-10T12:00:00Z'),
        categoryId: seedData.categoryIds.продукты,
        subcategoryId: seedData.subcategoryIds.рынок,
        projectId: seedData.projectId,
      },
    });

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

    // --- Removing a subcategory that a transaction still points at ---
    // The sidebar auto-saves on change, so removing the row is enough.
    await form.getByRole('button', { name: 'Удалить подкатегорию' }).click();
    await expect(
      form.getByRole('textbox', { name: 'Название подкатегории' }),
    ).toHaveCount(0);
    await page.waitForLoadState('networkidle');

    // The subcategory is gone and the transaction survived, just unlinked —
    // it must not have been blocked by the FK or deleted along with it.
    await expect
      .poll(() =>
        testPrisma.subcategory.count({
          where: { id: seedData.subcategoryIds.рынок },
        }),
      )
      .toBe(0);
    const kept = await testPrisma.expense.findUnique({ where: { id: tx.id } });
    expect(kept).not.toBeNull();
    expect(kept?.subcategoryId).toBeNull();
    expect(kept?.categoryId).toBe(seedData.categoryIds.продукты);
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
