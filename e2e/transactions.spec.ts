import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';
import { testPrisma } from './db/client';
import { transactionNameCellClass } from '../src/features/transactions/components/TransactionsTable/TransactionsTable';

async function selectOption(page: Page, label: string, option: string) {
  await page.getByRole('textbox', { name: label }).click();
  await page.getByRole('option', { name: option }).click();
}

interface VerifyTransactionOptions {
  /** Transaction comment. If omitted, row is located by categoryId alone. */
  name?: string;
  categoryId: number;
  subcategoryId?: number | null;
}

/**
 * Finds transaction row by (optionally) name, and grouping params
 * if there's no name, we just return the first found row inside the category/subcategory
 * It should be enough for 99% of test cases. If for whatever reason it's not enough,
 * tests should use other cells (like cost) to locate the row, and not use this function at all
 */
async function findTransactionRow(
  page: Page,
  { name, categoryId, subcategoryId }: VerifyTransactionOptions,
) {
  const subcategorySelector =
    subcategoryId != null
      ? `[data-testing-subcategory-id="${subcategoryId}"]`
      : '';
  const nameCell = page.locator(
    // There's no real way to find a row inside a specific group in mantine-react-table,
    // other than by setting data-attributes on the component side. It is a hack, but it works
    `.${transactionNameCellClass}[data-testing-category-id="${categoryId}"]${subcategorySelector}`,
    name ? { hasText: name } : undefined,
  );

  await expect(nameCell).toBeVisible();
  return nameCell.locator('xpath=ancestor::tr');
}

test.describe('Transaction creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/transactions');
  });

  // One complex expense covers: negative cost, subcategory attribute, source, and
  // that actualDate ≠ date does not affect which month the row appears in.
  test('create an expense with subcategory, source, and a different actualDate', async ({
    page,
    seedData,
  }) => {
    const form = page.getByRole('form', { name: 'Форма транзакции' });

    await page.getByRole('button', { name: 'Добавить' }).click();
    await selectOption(page, 'Категория', 'Транспорт');
    await selectOption(page, 'Подкатегория', 'Такси');
    await page.getByLabel('Сумма (€)').fill('30');
    await selectOption(page, 'Источник', 'Vivid');

    // Set actualDate to previous month — row must still appear in the current month
    await page
      .getByRole('button', { name: 'Реальная дата отличается' })
      .click();
    await page.getByLabel('Реальная дата').click();
    await page.locator('button[data-direction="previous"]').click();
    await page
      .locator('button:not([data-direction]):not([data-outside])', {
        hasText: /^15$/,
      })
      .first()
      .click();

    await form.getByRole('button', { name: 'Добавить' }).click();

    const row = await findTransactionRow(page, {
      categoryId: seedData.categoryIds.транспорт,
      subcategoryId: seedData.subcategoryIds.такси,
    });
    await expect(row.getByText('-€30.00')).toBeVisible();
    await expect(row.getByText('Vivid')).toBeVisible();

    await page.getByLabel('Сгруппировать по подкатегориям').click();
    await expect(
      page.locator(`.${transactionNameCellClass}[data-testing-depth="2"]`, {
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

    await selectOption(page, 'Категория', 'Зарплата');
    await page.getByLabel('Сумма (€)').fill('2000');

    await page
      .getByRole('form', { name: 'Форма транзакции' })
      .getByRole('button', { name: 'Добавить' })
      .click();

    const row = await findTransactionRow(page, {
      categoryId: seedData.categoryIds.зарплата,
    });
    // Income rows show a positive cost — no minus sign
    await expect(row.getByText('€2000.00')).toBeVisible();
  });

  test('create an expense with date in a previous month', async ({
    page,
    seedData,
  }) => {
    await page.getByRole('button', { name: 'Добавить' }).click();

    // Set the date to the previous month (day 15 — safe for all months).
    // Scoped to form because 'Дата' also appears in the table's sort/filter controls.
    await page
      .getByRole('form', { name: 'Форма транзакции' })
      .getByLabel('Дата')
      .click();
    await page.locator('button[data-direction="previous"]').click();
    await page
      .locator('button:not([data-direction]):not([data-outside])', {
        hasText: /^15$/,
      })
      .first()
      .click();

    await selectOption(page, 'Категория', 'Продукты');

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
        `.${transactionNameCellClass}[data-testing-category-id="${seedData.categoryIds.продукты}"]`,
        { hasText: 'прошлый месяц' },
      ),
    ).toHaveCount(0);

    // Navigate to the previous month
    await page.getByRole('button', { name: 'Previous' }).click();
    await page.waitForLoadState('networkidle');

    // Now the row should be visible
    const row = await findTransactionRow(page, {
      categoryId: seedData.categoryIds.продукты,
      name: 'прошлый месяц',
    });
    await expect(row.getByText('-€100.00')).toBeVisible();
  });
});

test.describe('Transaction editing', () => {
  test('change type income→expense flips cost sign in table via auto-save', async ({
    page,
    seedData,
  }) => {
    await testPrisma.expense.create({
      data: {
        name: 'Смена типа',
        cost: 50, // positive income cost
        date: new Date(),
        categoryId: seedData.categoryIds.зарплата,
        userId: seedData.userId,
      },
    });
    await page.goto('/transactions');

    const incomeRow = await findTransactionRow(page, {
      categoryId: seedData.categoryIds.зарплата,
      name: 'Смена типа',
    });
    await expect(incomeRow.getByText('€50.00')).toBeVisible();

    await incomeRow.getByRole('button', { name: 'Редактировать' }).click();

    // Switch to expense type
    await page
      .getByRole('radiogroup', { name: 'Тип' })
      .locator('input[value="expense"]')
      .dispatchEvent('click');
    await selectOption(page, 'Категория', 'Продукты');

    // Auto-save fires and the row moves to the expense section with a negative cost
    const expenseRow = await findTransactionRow(page, {
      categoryId: seedData.categoryIds.продукты,
      name: 'Смена типа',
    });
    await expect(expenseRow.getByText('-€50.00')).toBeVisible();
  });

  test('close sidebar with validation error shows confirm; dismiss keeps changes; confirm discards', async ({
    page,
    seedData,
  }) => {
    await testPrisma.expense.create({
      data: {
        name: 'Несохранённые изменения',
        cost: -50,
        date: new Date(),
        categoryId: seedData.categoryIds.продукты,
        userId: seedData.userId,
      },
    });
    await page.goto('/transactions');

    const row = await findTransactionRow(page, {
      categoryId: seedData.categoryIds.продукты,
      name: 'Несохранённые изменения',
    });
    await row.getByRole('button', { name: 'Редактировать' }).click();

    const form = page.getByRole('form', { name: 'Форма транзакции' });

    // Clear the cost to introduce a validation error — auto-save is skipped on
    // invalid forms, so the "unsaved changes" confirm dialog is the only guard.
    await form.getByLabel('Сумма (€)').fill('');

    // Close → confirm dialog should appear
    await page.getByRole('button', { name: 'Закрыть' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Dismiss → sidebar stays open, change is preserved
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Отмена' })
      .click();
    await expect(form).toBeVisible();
    await expect(form.getByLabel('Сумма (€)')).toHaveValue('');

    // Close again → confirm dialog
    await page.getByRole('button', { name: 'Закрыть' }).click();

    // Confirm → sidebar closes, change is discarded
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Продолжить' })
      .click();
    // Sidebar slides off-screen via CSS transform (translateX 100%) — use
    // toBeInViewport rather than toBeVisible, which CSS transforms don't affect.
    await expect(form).not.toBeInViewport();

    // Table still shows the original cost (discarded change)
    await expect(row.getByText('-€50.00')).toBeVisible();
  });

  test('edit cost with auto-save, then delete via row action', async ({
    page,
    seedData,
  }) => {
    await testPrisma.expense.create({
      data: {
        name: 'Правка и удаление',
        cost: -50,
        date: new Date(),
        categoryId: seedData.categoryIds.продукты,
        sourceId: seedData.sourceId,
        userId: seedData.userId,
      },
    });
    await page.goto('/transactions');

    const row = await findTransactionRow(page, {
      categoryId: seedData.categoryIds.продукты,
      name: 'Правка и удаление',
    });

    await row.getByRole('button', { name: 'Редактировать' }).click();

    const form = page.getByRole('form', { name: 'Форма транзакции' });

    // Verify pre-filled fields match what was saved
    await expect(form.getByLabel('Сумма (€)')).toHaveValue('-50');
    await expect(
      form.getByRole('textbox', { name: 'Категория', exact: true }),
    ).toHaveValue('Продукты');
    await expect(form.getByRole('textbox', { name: 'Источник' })).toHaveValue(
      'Vivid',
    );
    await expect(form.getByLabel('Комментарий')).toHaveValue(
      'Правка и удаление',
    );

    await form.getByLabel('Сумма (€)').fill('75');
    await expect(row.getByText('-€75.00')).toBeVisible();

    await row.getByRole('button', { name: 'Удалить' }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Удалить' })
      .click();
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator(
        `.${transactionNameCellClass}[data-testing-category-id="${seedData.categoryIds.продукты}"]`,
        { hasText: 'Правка и удаление' },
      ),
    ).toHaveCount(0);
  });
});
