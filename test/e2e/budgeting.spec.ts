import type { Locator, Page } from '@playwright/test';

import { expect, test } from './fixtures';

// Returns the first <tr> whose visible text contains `name`
function getRow(page: Page, name: string) {
  return page.locator('tbody tr').filter({ hasText: name }).first();
}

function getPlanCell(row: Locator) {
  return row.locator('[data-testing-column="plan"]');
}

function getCommentCell(row: Locator) {
  return row.locator('[data-testing-column="comment"]');
}

function getActualCell(
  row: Locator,
  col: 'thisMonth' | 'lastMonth' | 'average',
) {
  return row.locator(`[data-testing-column="${col}"]`);
}

async function editPlanCell(row: Locator, value: string) {
  await getPlanCell(row).dblclick();
  await row.locator('input[type="number"]').fill(value);
  await row.locator('input[type="number"]').press('Enter');
}

async function editCommentCell(row: Locator, value: string) {
  await getCommentCell(row).dblclick();
  await getCommentCell(row).locator('input').fill(value);
  await getCommentCell(row).locator('input').press('Enter');
}

test.describe('Budgeting transaction totals columns', () => {
  test('shows seeded transaction actuals in thisMonth, lastMonth, and average columns', async ({
    page,
  }) => {
    await page.goto('/budgeting');

    const транспортRow = getRow(page, 'Транспорт');

    // Seeded: cost=50 this month, cost=30 last month (both are positive in DB, shown as expenses)
    await expect(getActualCell(транспортRow, 'thisMonth')).toContainText(
      '-€50.00',
    );
    await expect(getActualCell(транспортRow, 'lastMonth')).toContainText(
      '-€30.00',
    );

    // Average over 2 months: (-50 + -30) / 2 = -40
    await expect(getActualCell(транспортRow, 'average')).toContainText(
      '-€40.00',
    );
  });
});

test.describe('Budgeting inline editing', () => {
  // Test 1: display + basic plan edit + persistence
  test('displays seeded forecast, edits plan value, persists on reload', async ({
    page,
  }) => {
    await page.goto('/budgeting');

    const транспортRow = getRow(page, 'Транспорт');
    const продуктыRow = getRow(page, 'Продукты');

    // Seeded forecast shown; zero category shows €0.00
    await expect(getPlanCell(продуктыRow)).toHaveText('-€100.00');
    await expect(getPlanCell(транспортRow)).toHaveText('€0.00');

    // Double-click plan cell → edit input pre-populated with absolute magnitude
    await getPlanCell(транспортRow).dblclick();
    const input = транспортRow.locator('input[type="number"]');
    await expect(input).toBeVisible();
    await expect(input).toHaveValue('0');

    // Fill and confirm with Enter
    await input.fill('50');
    await input.press('Enter');
    await expect(getPlanCell(транспортRow)).toHaveText('-€50.00');

    // Reload confirms persistence
    await page.reload();
    await expect(getPlanCell(транспортRow)).toHaveText('-€50.00');
  });

  // Test 2: subcategory edit, additive total, locked parent, rest row, comment
  test('subcategory edits raise total, lock parent, rest row is independent, comment persists', async ({
    page,
  }) => {
    await page.goto('/budgeting');

    const продуктыRow = getRow(page, 'Продукты');

    // Expand Продукты
    await продуктыRow.getByRole('button').first().click();

    const рынокRow = getRow(page, 'Рынок');
    const остальноеRow = getRow(page, 'Остальное');

    // Initial state: rest row = seeded forecast, subcategory = 0
    await expect(getPlanCell(рынокRow)).toHaveText('€0.00');
    await expect(getPlanCell(остальноеRow)).toHaveText('-€100.00');

    // Parent is editable before any subcategory is filled
    await getPlanCell(продуктыRow).dblclick();
    await expect(продуктыRow.locator('input[type="number"]')).toBeVisible();
    await продуктыRow.locator('input[type="number"]').press('Escape');

    // Edit Рынок to 30; additive model: total = subSum(30) + restSum(100) = 130
    await editPlanCell(рынокRow, '30');
    await expect(getPlanCell(рынокRow)).toHaveText('-€30.00');
    await expect(getPlanCell(остальноеRow)).toHaveText('-€100.00');
    await expect(getPlanCell(продуктыRow)).toHaveText('-€130.00');

    // Parent is now locked — double-clicking shows tooltip, no input opens
    await getPlanCell(продуктыRow).dblclick();
    await expect(продуктыRow.locator('input[type="number"]')).toHaveCount(0);
    await expect(page.getByRole('tooltip')).toBeVisible();

    // Edit rest row to 50 → total = subSum(30) + restSum(50) = 80
    await editPlanCell(остальноеRow, '50');
    await expect(getPlanCell(остальноеRow)).toHaveText('-€50.00');
    await expect(getPlanCell(продуктыRow)).toHaveText('-€80.00');

    // Comment: edit Транспорт, persist on reload
    const транспортRow = getRow(page, 'Транспорт');
    await editCommentCell(транспортRow, 'тест');
    await expect(getCommentCell(транспортRow)).toHaveText('тест');

    await page.reload();
    await expect(getCommentCell(транспортRow)).toHaveText('тест');
  });
});
