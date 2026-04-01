import type { Locator, Page } from '@playwright/test';

import { expect, test } from './fixtures';
import { testPrisma } from './db/client';
import { transactionNameCellClass } from '../src/features/transactions/components/TransactionsTable/TransactionsTable';
import { TODAY_DAY, TODAY_MONTH, TODAY_YEAR } from '../src/shared/utils/today';

async function selectTreeOption(page: Page, treeSelect: Locator, option: string) {
  await treeSelect.click();
  await treeSelect.locator('.rc-tree-select-selection-search-input').fill(option);
  await page
    .locator('.treeSelectDropdown')
    .getByText(option, { exact: true })
    .first()
    .click();
}

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

test.describe('Transaction components', () => {
  test('add two components in different categories; hint and rows appear', async ({
    page,
    seedData,
  }) => {
    await page.goto('/transactions');
    const form = page.getByRole('form', { name: 'Форма транзакции' });

    await page.getByRole('button', { name: 'Добавить' }).click();
    await selectOption(page, 'Категория', 'Продукты');
    await form.getByLabel('Сумма (€)').fill('100');
    await form.getByLabel('Комментарий').fill('Тест компонентов');

    // Open the components modal
    await form.getByRole('button', { name: 'Редактировать составляющие' }).click();
    const dialog = page.getByRole('dialog', { name: 'Составляющие' });

    // Add first component: 30 → Транспорт
    await dialog.getByRole('button', { name: 'Добавить составляющую' }).click();
    await dialog.getByPlaceholder('Сумма (€)').nth(0).fill('30');
    await selectTreeOption(page, dialog.locator('.treeSelect').nth(0), 'Транспорт');

    // Add second component: 20 → Развлечения
    await dialog.getByRole('button', { name: 'Добавить составляющую' }).click();
    await dialog.getByPlaceholder('Сумма (€)').nth(1).fill('20');
    await selectTreeOption(page, dialog.locator('.treeSelect').nth(1), 'Развлечения');

    // Modal shows correct remainder: 100 - 30 - 20 = 50
    await expect(dialog.getByText('Остаток: €50.00')).toBeVisible();
    await dialog.getByRole('button', { name: 'Сохранить' }).click();

    // Hint visible in the form with signed costs and remainder
    await expect(form.getByText('Из них:')).toBeVisible();
    await expect(form.getByText('-€30.00 из Транспорт')).toBeVisible();
    await expect(form.getByText('-€20.00 из Развлечения')).toBeVisible();
    await expect(form.getByText('(остаток: €50.00)')).toBeVisible();

    // Submit the transaction
    await form.getByRole('button', { name: 'Добавить' }).click();
    await page.waitForLoadState('networkidle');

    // Parent row: cost without components = 100 - 30 - 20 = 50 → -€50.00 main
    const parentRow = await findTransactionRow(page, {
      categoryId: seedData.categoryIds.продукты,
      name: 'Тест компонентов',
    });
    await expect(parentRow.getByText('-€50.00')).toBeVisible();
    await expect(parentRow.getByText('(-€100.00)')).toBeVisible();

    // Component rows appear under their respective categories
    await expect(
      page.locator(
        `.${transactionNameCellClass}[data-testing-category-id="${seedData.categoryIds.транспорт}"]`,
        { hasText: 'Тест компонентов' },
      ),
    ).toBeVisible();
    await expect(
      page.locator(
        `.${transactionNameCellClass}[data-testing-category-id="${seedData.categoryIds.развлечения}"]`,
        { hasText: 'Тест компонентов' },
      ),
    ).toBeVisible();
  });

  test('pre-existing transaction with components: verify hint, delete one component via modal', async ({
    page,
    seedData,
  }) => {
    await testPrisma.expense.create({
      data: {
        name: 'Покупка в магазине',
        cost: 100,
        date: new Date(TODAY_YEAR, TODAY_MONTH, TODAY_DAY),
        categoryId: seedData.categoryIds.продукты,
        userId: seedData.userId,
        components: {
          create: [
            { name: 'Аптека', cost: 30, categoryId: seedData.categoryIds.транспорт },
            { name: 'Напитки', cost: 20, categoryId: seedData.categoryIds.развлечения },
          ],
        },
      },
    });
    await page.goto('/transactions');

    // Component rows are visible in their categories
    await expect(
      page.locator(
        `.${transactionNameCellClass}[data-testing-category-id="${seedData.categoryIds.транспорт}"]`,
        { hasText: 'Аптека' },
      ),
    ).toBeVisible();
    await expect(
      page.locator(
        `.${transactionNameCellClass}[data-testing-category-id="${seedData.categoryIds.развлечения}"]`,
        { hasText: 'Напитки' },
      ),
    ).toBeVisible();

    // Open parent transaction
    const parentRow = await findTransactionRow(page, {
      categoryId: seedData.categoryIds.продукты,
      name: 'Покупка в магазине',
    });
    await parentRow.getByRole('button', { name: 'Редактировать' }).click();

    const form = page.getByRole('form', { name: 'Форма транзакции' });
    await expect(form.getByText('Из них:')).toBeVisible();

    // Open components modal — both rows should be pre-filled
    await form.getByRole('button', { name: 'Редактировать составляющие' }).click();
    const dialog = page.getByRole('dialog', { name: 'Составляющие' });
    await expect(dialog.getByPlaceholder('Сумма (€)')).toHaveCount(2);

    // Delete the first component (Аптека / Транспорт)
    await dialog.getByRole('button', { name: 'Удалить' }).first().click();
    await dialog.getByRole('button', { name: 'Сохранить' }).click();

    // Auto-save fires; wait for the table to update
    await expect(
      page.locator(
        `.${transactionNameCellClass}[data-testing-category-id="${seedData.categoryIds.транспорт}"]`,
        { hasText: 'Аптека' },
      ),
    ).toHaveCount(0);

    // Hint updates to single-component format
    await expect(
      form.getByText(/Из них -€20\.00 из «Развлечения»/),
    ).toBeVisible();

  });

  test('edit component via its own row action: modal opens, updated cost propagates', async ({
    page,
    seedData,
  }) => {
    await testPrisma.expense.create({
      data: {
        name: 'Семья',
        cost: 100,
        date: new Date(TODAY_YEAR, TODAY_MONTH, TODAY_DAY),
        categoryId: seedData.categoryIds.продукты,
        userId: seedData.userId,
        components: {
          create: [
            { name: 'Одежда', cost: 30, categoryId: seedData.categoryIds.транспорт },
          ],
        },
      },
    });
    await page.goto('/transactions');

    // Click "Редактировать" on the component row — opens sidebar + modal together
    const componentRow = await findTransactionRow(page, {
      categoryId: seedData.categoryIds.транспорт,
      name: 'Одежда',
    });
    await componentRow.getByRole('button', { name: 'Редактировать' }).click();

    const dialog = page.getByRole('dialog', { name: 'Составляющие' });
    await expect(dialog).toBeVisible();

    // Change the component cost from 30 to 50
    await dialog.getByPlaceholder('Сумма (€)').fill('-50');
    await dialog.getByRole('button', { name: 'Сохранить' }).click();

    // Auto-save fires; component row updates to new cost
    const updatedComponentRow = await findTransactionRow(page, {
      categoryId: seedData.categoryIds.транспорт,
      name: 'Одежда',
    });
    await expect(updatedComponentRow.getByText('-€50.00')).toBeVisible();

    // Parent row remainder updates: 100 - 50 = 50
    const parentRow = await findTransactionRow(page, {
      categoryId: seedData.categoryIds.продукты,
      name: 'Семья',
    });
    await expect(parentRow.getByText('-€50.00')).toBeVisible();
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
        date: new Date(TODAY_YEAR, TODAY_MONTH, TODAY_DAY),
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
        date: new Date(TODAY_YEAR, TODAY_MONTH, TODAY_DAY),
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
        date: new Date(TODAY_YEAR, TODAY_MONTH, TODAY_DAY),
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

test.describe('Subscriptions', () => {
  test('create transaction: select subscription auto-fills name, cost, source', async ({
    page,
    seedData,
  }) => {
    await testPrisma.subscription.create({
      data: {
        name: 'Спотифай',
        cost: 9.99,
        categoryId: seedData.categoryIds.развлечения,
        sourceId: seedData.sourceId,
        period: 1,
        firstDate: new Date(TODAY_YEAR, TODAY_MONTH, 1),
        active: true,
        userId: seedData.userId,
      },
    });
    await page.goto('/transactions');

    const form = page.getByRole('form', { name: 'Форма транзакции' });

    await page.getByRole('button', { name: 'Добавить' }).click();
    await selectOption(page, 'Категория', 'Развлечения');

    // Subscription field appears for this category
    await expect(form.getByRole('textbox', { name: 'Подписка' })).toBeVisible();
    await selectOption(page, 'Подписка', 'Спотифай');

    // Form auto-fills name, cost and source from the subscription
    await expect(form.getByLabel('Комментарий')).toHaveValue('Спотифай');
    await expect(form.getByLabel('Сумма (€)')).toHaveValue('-9.99');
    await expect(form.getByRole('textbox', { name: 'Источник' })).toHaveValue(
      'Vivid',
    );

    await form.getByRole('button', { name: 'Добавить' }).click();
    await page.waitForLoadState('networkidle');

    const row = await findTransactionRow(page, {
      name: 'Спотифай',
      categoryId: seedData.categoryIds.развлечения,
    });
    await expect(row.getByRole('img', { name: 'Подписка' })).toBeVisible();
  });

  test('edit subscription transaction: change subscription updates fields and auto-saves', async ({
    page,
    seedData,
  }) => {
    const firstDate = new Date(TODAY_YEAR, TODAY_MONTH, 1);
    const sub1 = await testPrisma.subscription.create({
      data: {
        name: 'Спотифай',
        cost: 9.99,
        categoryId: seedData.categoryIds.развлечения,
        sourceId: seedData.sourceId,
        period: 1,
        firstDate,
        active: true,
        userId: seedData.userId,
      },
    });
    await testPrisma.subscription.create({
      data: {
        name: 'Кинопоиск',
        cost: 5.99,
        categoryId: seedData.categoryIds.развлечения,
        sourceId: seedData.sourceId,
        period: 1,
        firstDate,
        active: true,
        userId: seedData.userId,
      },
    });
    await testPrisma.expense.create({
      data: {
        name: 'Спотифай',
        cost: -9.99,
        date: new Date(TODAY_YEAR, TODAY_MONTH, TODAY_DAY),
        categoryId: seedData.categoryIds.развлечения,
        sourceId: seedData.sourceId,
        subscriptionId: sub1.id,
        userId: seedData.userId,
      },
    });
    await page.goto('/transactions');

    const row = await findTransactionRow(page, {
      name: 'Спотифай',
      categoryId: seedData.categoryIds.развлечения,
    });
    await row.getByRole('button', { name: 'Редактировать' }).click();

    const form = page.getByRole('form', { name: 'Форма транзакции' });

    // Subscription field shows the original subscription
    await expect(form.getByRole('textbox', { name: 'Подписка' })).toHaveValue(
      'Спотифай',
    );

    // Change to a different subscription — form fields update automatically
    await selectOption(page, 'Подписка', 'Кинопоиск');
    await expect(form.getByLabel('Комментарий')).toHaveValue('Кинопоиск');
    await expect(form.getByLabel('Сумма (€)')).toHaveValue('-5.99');

    // Auto-save fires after the debounce; the row name updates to 'Кинопоиск' (auto-filled).
    // Find it fresh — the original 'Спотифай' locator is now stale.
    const updatedRow = await findTransactionRow(page, {
      name: 'Кинопоиск',
      categoryId: seedData.categoryIds.развлечения,
    });
    await expect(updatedRow.getByText('-€5.99')).toBeVisible();
  });

  test('toggle upcoming subscriptions: rows appear/disappear, no actions, excluded from total', async ({
    page,
    seedData,
  }) => {
    const firstDate = new Date(TODAY_YEAR, TODAY_MONTH, 1);
    await testPrisma.expense.create({
      data: {
        name: 'Обед',
        cost: -50,
        date: new Date(TODAY_YEAR, TODAY_MONTH, TODAY_DAY),
        categoryId: seedData.categoryIds.развлечения,
        userId: seedData.userId,
      },
    });
    await testPrisma.subscription.create({
      data: {
        name: 'Спотифай',
        cost: 9.99,
        categoryId: seedData.categoryIds.развлечения,
        sourceId: seedData.sourceId,
        period: 1,
        firstDate,
        active: true,
        userId: seedData.userId,
      },
    });
    await page.goto('/transactions');

    // Toggle is off by default — upcoming subscription row is not shown
    await expect(
      page.locator(
        `.${transactionNameCellClass}[data-testing-category-id="${seedData.categoryIds.развлечения}"]`,
        { hasText: 'Спотифай' },
      ),
    ).toHaveCount(0);

    // Развлечения aggregate shows only the regular transaction.
    // Use data-testing-depth="1" to target the category-level aggregate row specifically
    // (individual transaction rows also have 'Развлечения' in their cells, causing ambiguity
    // with a plain text filter).
    const развлеченияAggRow = page
      .locator(`.${transactionNameCellClass}[data-testing-depth="1"]`, {
        hasText: 'Развлечения',
      })
      .locator('xpath=ancestor::tr');
    await expect(развлеченияAggRow.getByText('-€50.00').first()).toBeVisible();

    // Enable upcoming subscriptions
    await page.getByLabel('Предстоящие подписки').click();

    const upcomingRow = await findTransactionRow(page, {
      name: 'Спотифай',
      categoryId: seedData.categoryIds.развлечения,
    });

    // Upcoming row shows the subscription badge
    await expect(
      upcomingRow.getByRole('img', { name: 'Предстоящая подписка' }),
    ).toBeVisible();

    // Upcoming rows have no edit or delete actions
    await expect(
      upcomingRow.getByRole('button', { name: 'Редактировать' }),
    ).toHaveCount(0);
    await expect(
      upcomingRow.getByRole('button', { name: 'Удалить' }),
    ).toHaveCount(0);

    // Aggregate total is unchanged — upcoming subscriptions are excluded
    await expect(развлеченияAggRow.getByText('-€50.00').first()).toBeVisible();

    // Disable upcoming subscriptions — row disappears
    await page.getByLabel('Предстоящие подписки').click();
    await expect(
      page.locator(
        `.${transactionNameCellClass}[data-testing-category-id="${seedData.categoryIds.развлечения}"]`,
        { hasText: 'Спотифай' },
      ),
    ).toHaveCount(0);
  });
});

test.describe('Saving spendings', () => {
  // Case 13 — create a from-savings transaction
  // Asserts: event select visible, category hidden for single-category event,
  // category visible for multi-category event, completed event absent,
  // row excluded from expense grand total, group rows appear under subcategory grouping.
  test('create a from-savings transaction: event select, hidden/visible category, completed event absent, excluded from expense total, group rows appear', async ({
    page,
    seedData,
  }) => {
    // Pre-seed: one FROM_SAVINGS transaction (Event A, single category)
    // and one regular expense to anchor the expense grand total.
    await testPrisma.expense.create({
      data: {
        name: 'Предоплата',
        cost: -100,
        date: new Date(TODAY_YEAR, TODAY_MONTH, TODAY_DAY),
        categoryId: seedData.categoryIds.изСбережений,
        savingSpendingCategoryId: seedData.savingSpendingCategoryIds.eventAGeneral,
        userId: seedData.userId,
      },
    });
    await testPrisma.expense.create({
      data: {
        name: 'Обед',
        cost: -50,
        date: new Date(TODAY_YEAR, TODAY_MONTH, TODAY_DAY),
        categoryId: seedData.categoryIds.продукты,
        userId: seedData.userId,
      },
    });
    await page.goto('/transactions');

    // Pre-seeded FROM_SAVINGS row is visible (hasText matches "Отпуск Рим 2025 - Общее (Предоплата)")
    await findTransactionRow(page, {
      name: 'Предоплата',
      categoryId: seedData.categoryIds.изСбережений,
    });

    const form = page.getByRole('form', { name: 'Форма транзакции' });
    await page.getByRole('button', { name: 'Добавить' }).click();

    // Switch to "Из сбережений" type
    await page
      .getByRole('radiogroup', { name: 'Тип' })
      .locator('input[value="fromSavings"]')
      .dispatchEvent('click');

    // "Событие" select appears; saving-spending category not shown yet
    await expect(form.getByRole('textbox', { name: 'Событие' })).toBeVisible();
    await expect(
      form.getByRole('textbox', { name: 'Категория' }),
    ).not.toBeVisible();

    // Completed event is absent from the dropdown
    await form.getByRole('textbox', { name: 'Событие' }).click();
    await expect(
      page.getByRole('option', { name: 'Новый телевизор', exact: true }),
    ).toHaveCount(0);

    // Select Event A (single category) — category select stays hidden
    await page.getByRole('option', { name: 'Отпуск Рим 2025' }).click();
    await expect(
      form.getByRole('textbox', { name: 'Категория' }),
    ).not.toBeVisible();

    // Select Event B (multiple categories) — category select appears
    await selectOption(page, 'Событие', 'Переезд 2026');
    await expect(form.getByRole('textbox', { name: 'Категория' })).toBeVisible();
    await selectOption(page, 'Категория', 'Залог');

    await form.getByLabel('Сумма (€)').fill('200');
    await form.getByRole('button', { name: 'Добавить' }).click();
    await page.waitForLoadState('networkidle');

    // New row appears under Из сбережений, grouped under Event B
    const newRow = await findTransactionRow(page, {
      categoryId: seedData.categoryIds.изСбережений,
      subcategoryId: seedData.savingSpendingIds.eventB,
    });
    await expect(newRow.getByText('-€200.00')).toBeVisible();

    // Expense grand total (depth=0 "Расход" row) is unchanged — FROM_SAVINGS is excluded
    const расходAggRow = page
      .locator(`.${transactionNameCellClass}[data-testing-depth="0"]`, {
        hasText: 'Расход',
      })
      .locator('xpath=ancestor::tr');
    await expect(расходAggRow.getByText('-€50.00').first()).toBeVisible();

    // Group by subcategories: event group rows appear for both pre-seeded (Event A) and new (Event B)
    await page.getByLabel('Сгруппировать по подкатегориям').click();
    await expect(
      page.locator(`.${transactionNameCellClass}[data-testing-depth="2"]`, {
        hasText: 'Отпуск Рим 2025',
      }),
    ).toBeVisible();
    await expect(
      page.locator(`.${transactionNameCellClass}[data-testing-depth="2"]`, {
        hasText: 'Переезд 2026',
      }),
    ).toBeVisible();
  });

  // Case 14 — edit a from-savings transaction that was linked to a completed event.
  // Asserts: completed event shown as initial value, category select updates on event change,
  // auto-save moves the row to the new event's subcategory group.
  test('edit from-savings transaction linked to completed event: initial value preserved, category select updates on event change', async ({
    page,
    seedData,
  }) => {
    await testPrisma.expense.create({
      data: {
        name: 'Ноутбук',
        cost: -200,
        date: new Date(TODAY_YEAR, TODAY_MONTH, TODAY_DAY),
        categoryId: seedData.categoryIds.изСбережений,
        savingSpendingCategoryId:
          seedData.savingSpendingCategoryIds.eventCElectronics,
        userId: seedData.userId,
      },
    });
    await page.goto('/transactions');

    // Open the transaction (hasText matches "Новый телевизор - Электроника (Ноутбук)")
    const row = await findTransactionRow(page, {
      name: 'Ноутбук',
      categoryId: seedData.categoryIds.изСбережений,
    });
    await row.getByRole('button', { name: 'Редактировать' }).click();

    const form = page.getByRole('form', { name: 'Форма транзакции' });

    // Completed event is preserved as the initial "Событие" value
    await expect(form.getByRole('textbox', { name: 'Событие' })).toHaveValue(
      'Новый телевизор',
    );

    // Category select hidden — Event C has only one category
    await expect(
      form.getByRole('textbox', { name: 'Категория' }),
    ).not.toBeVisible();

    // Switch to Event B (multiple categories) — category select appears
    await selectOption(page, 'Событие', 'Переезд 2026');
    await expect(form.getByRole('textbox', { name: 'Категория' })).toBeVisible();

    // Select a category — auto-save fires; row moves to Event B subcategory
    await selectOption(page, 'Категория', 'Залог');
    await findTransactionRow(page, {
      name: 'Ноутбук',
      categoryId: seedData.categoryIds.изСбережений,
      subcategoryId: seedData.savingSpendingIds.eventB,
    });
  });

  // Case 15 — change transaction type from "from savings" to expense.
  // Asserts: row moves to the expense category section; Из сбережений section becomes empty.
  test('change from-savings type to expense: transaction moves to expense section', async ({
    page,
    seedData,
  }) => {
    await testPrisma.expense.create({
      data: {
        name: 'Мебель',
        cost: -500,
        date: new Date(TODAY_YEAR, TODAY_MONTH, TODAY_DAY),
        categoryId: seedData.categoryIds.изСбережений,
        savingSpendingCategoryId: seedData.savingSpendingCategoryIds.eventAGeneral,
        userId: seedData.userId,
      },
    });
    await page.goto('/transactions');

    const row = await findTransactionRow(page, {
      name: 'Мебель',
      categoryId: seedData.categoryIds.изСбережений,
    });
    await row.getByRole('button', { name: 'Редактировать' }).click();

    // Switch to expense type
    await page
      .getByRole('radiogroup', { name: 'Тип' })
      .locator('input[value="expense"]')
      .dispatchEvent('click');

    // Select an expense category to make the form valid — auto-save fires after this
    await selectOption(page, 'Категория', 'Продукты');

    // Row moves from Из сбережений to Продукты (cost now counts toward expense totals)
    const expenseRow = await findTransactionRow(page, {
      name: 'Мебель',
      categoryId: seedData.categoryIds.продукты,
    });
    await expect(expenseRow.getByText('-€500.00')).toBeVisible();

    // Из сбережений section is now empty
    await expect(
      page.locator(
        `.${transactionNameCellClass}[data-testing-category-id="${seedData.categoryIds.изСбережений}"]`,
      ),
    ).toHaveCount(0);
  });
});
