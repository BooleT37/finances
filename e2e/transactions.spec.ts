import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';

const transactionNameCellClass = 'transaction-name-cell';

interface VerifyTransactionOptions {
  /** Transaction comment. If omitted, row is located by categoryId alone. */
  name?: string;
  categoryId: number;
  subcategoryId?: number | null;
  cost: number; // negative for expense, positive for income
  /** Source name as displayed in the table. If omitted, source is not verified. */
  sourceName?: string;
}

async function verifyTransactionInTable(
  page: Page,
  { name, categoryId, subcategoryId = null, cost, sourceName }: VerifyTransactionOptions,
) {
  const formattedCost =
    cost < 0 ? `-€${Math.abs(cost).toFixed(2)}` : `€${cost.toFixed(2)}`;

  // [data-category-id] selects leaf rows only (grouped rows have the attribute unset).
  // hasText further narrows when multiple transactions share the same category.
  const nameCell = page.locator(
    `.${transactionNameCellClass}[data-category-id="${categoryId}"]`,
    name ? { hasText: name } : undefined,
  );

  await expect(nameCell).toHaveAttribute(
    'data-category-id',
    String(categoryId),
  );
  if (subcategoryId === null) {
    await expect(nameCell).not.toHaveAttribute('data-subcategory-id');
  } else {
    await expect(nameCell).toHaveAttribute(
      'data-subcategory-id',
      String(subcategoryId),
    );
  }

  const row = nameCell.locator('xpath=ancestor::tr');
  await expect(row.getByText(formattedCost)).toBeVisible();
  if (sourceName !== undefined) {
    await expect(row.getByText(sourceName)).toBeVisible();
  }
}

test.describe('Transactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/transactions');
  });

  test('create a minimal expense (category + cost only)', async ({
    page,
    seedData,
  }) => {
    await page.getByRole('button', { name: 'Добавить' }).click();

    await page.getByRole('textbox', { name: 'Категория' }).click();
    await page.getByRole('option', { name: 'Продукты' }).click();

    await page.getByLabel('Сумма (€)').fill('50');

    await page.getByRole('textbox', { name: 'Источник' }).click();
    await page.getByRole('option', { name: 'Vivid' }).click();

    await page
      .getByRole('form', { name: 'Форма транзакции' })
      .getByRole('button', { name: 'Добавить' })
      .click();

    // Sidebar closes on success; table shows the new row
    await verifyTransactionInTable(page, {
      categoryId: seedData.categoryIds.продукты,
      cost: -50,
      sourceName: 'Vivid',
    });
  });

  test('create an expense with subcategory', async ({ page, seedData }) => {
    await page.getByRole('button', { name: 'Добавить' }).click();

    await page.getByRole('textbox', { name: 'Категория' }).click();
    await page.getByRole('option', { name: 'Транспорт' }).click();

    await page.getByRole('textbox', { name: 'Подкатегория' }).click();
    await page.getByRole('option', { name: 'Такси' }).click();

    await page.getByLabel('Сумма (€)').fill('30');

    await page
      .getByRole('form', { name: 'Форма транзакции' })
      .getByRole('button', { name: 'Добавить' })
      .click();

    // Leaf row has the correct subcategoryId
    await verifyTransactionInTable(page, {
      categoryId: seedData.categoryIds.транспорт,
      subcategoryId: seedData.subcategoryIds.такси,
      cost: -30,
    });

    // Enable group-by-subcategories; the subcategory group row appears
    await page.getByLabel('Сгруппировать по подкатегориям').click();
    await expect(
      page.locator(`.${transactionNameCellClass}:not([data-category-id])`, {
        hasText: 'Такси',
      }),
    ).toBeVisible();
  });

  test('create an income transaction', async ({ page, seedData }) => {
    await page.getByRole('button', { name: 'Добавить' }).click();

    // Mantine SegmentedControl hides radio inputs behind labels; dispatchEvent bypasses hit-testing.
    await page
      .getByRole('radiogroup', { name: 'Тип' })
      .locator('input[value="income"]')
      .dispatchEvent('click');

    await page.getByRole('textbox', { name: 'Категория' }).click();
    await page.getByRole('option', { name: 'Зарплата' }).click();

    await page.getByLabel('Сумма (€)').fill('2000');

    await page
      .getByRole('form', { name: 'Форма транзакции' })
      .getByRole('button', { name: 'Добавить' })
      .click();

    // Income rows show a positive cost — no minus sign
    await verifyTransactionInTable(page, {
      categoryId: seedData.categoryIds.зарплата,
      cost: 2000,
    });
  });

  test('create an expense with actualDate in a different month', async ({
    page,
    seedData,
  }) => {
    await page.getByRole('button', { name: 'Добавить' }).click();

    await page.getByRole('textbox', { name: 'Категория' }).click();
    await page.getByRole('option', { name: 'Продукты' }).click();

    await page.getByLabel('Сумма (€)').fill('75');

    // Reveal the actual date field and pick a date in the previous month
    await page.getByRole('button', { name: 'Реальная дата отличается' }).click();
    await page.getByLabel('Реальная дата').click();
    // Navigate to the previous month in the calendar popup
    await page.locator('button[data-direction="previous"]').click();
    // Pick day 15 — safe for all months; exclude [data-outside] (adjacent-month) days
    await page
      .locator('button:not([data-direction]):not([data-outside])', { hasText: /^15$/ })
      .first()
      .click();

    await page
      .getByRole('form', { name: 'Форма транзакции' })
      .getByRole('button', { name: 'Добавить' })
      .click();

    // Transaction still appears in the current month because 'date' (not actualDate) governs placement
    await verifyTransactionInTable(page, {
      categoryId: seedData.categoryIds.продукты,
      cost: -75,
    });
  });

  test('create an expense with date in a previous month', async ({
    page,
    seedData,
  }) => {
    await page.getByRole('button', { name: 'Добавить' }).click();

    // Set the date to the previous month (day 15 — safe for all months).
    // Scoped to form because 'Дата' also appears in the table's sort/filter controls.
    await page.getByRole('form', { name: 'Форма транзакции' }).getByLabel('Дата').click();
    await page.locator('button[data-direction="previous"]').click();
    await page
      .locator('button:not([data-direction]):not([data-outside])', {
        hasText: /^15$/,
      })
      .first()
      .click();

    await page.getByRole('textbox', { name: 'Категория' }).click();
    await page.getByRole('option', { name: 'Продукты' }).click();

    await page.getByLabel('Сумма (€)').fill('100');

    // Add a unique comment so this row is distinguishable from other продукты rows
    await page.getByLabel('Комментарий').fill('прошлый месяц');

    await page
      .getByRole('form', { name: 'Форма транзакции' })
      .getByRole('button', { name: 'Добавить' })
      .click();

    // Wait for the save request to complete before asserting absence
    await page.waitForLoadState('networkidle');

    // Transaction must NOT appear in the current month
    await expect(
      page.locator(
        `.${transactionNameCellClass}[data-category-id="${seedData.categoryIds.продукты}"]`,
        { hasText: 'прошлый месяц' },
      ),
    ).toHaveCount(0);

    // Navigate to the previous month
    await page.getByRole('button', { name: 'Previous' }).click();
    await page.waitForLoadState('networkidle');

    // Now the row should be visible
    await verifyTransactionInTable(page, {
      categoryId: seedData.categoryIds.продукты,
      name: 'прошлый месяц',
      cost: -100,
    });
  });
});
