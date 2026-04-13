import { expect, test } from '../fixtures';
import { getActualCell, getRow } from './budgeting.utils';

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
