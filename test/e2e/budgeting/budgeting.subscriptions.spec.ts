import type { Locator, Page } from '@playwright/test';

import { expect, test } from '../fixtures';
import { testPrisma } from '../db/client';
import {
  TODAY_DAY,
  TODAY_MONTH,
  TODAY_YEAR,
} from '../../../src/shared/utils/today';
import { expandRow, getPlanCell, getRow } from './budgeting.utils';

// ---------------------------------------------------------------------------
// File-local helpers
// ---------------------------------------------------------------------------

function getSubscriptionBadge(container: Locator | Page) {
  return container.locator('[data-testid="subscription-badge"]');
}

function getGrandTotalBadge(page: Page) {
  return page.locator(
    '[data-testid="plan-footer"] [data-testid="subscription-badge"]',
  );
}

async function hoverBadge(badge: Locator) {
  await badge.hover();
  return badge.page().locator('[data-testid="subscription-tooltip"]');
}

async function hoverGrandTotalBadge(page: Page) {
  await getGrandTotalBadge(page).hover();
  return page.locator('[data-testid="grand-total-subscription-tooltip"]');
}

async function confirmFill(page: Page) {
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Заполнить из подписок' })
    .click();
  await page.waitForLoadState('networkidle');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Budgeting subscriptions', () => {
  test('single category row: visibility, tooltip, inactive/not-due exclusion, click fills plan', async ({
    page,
  }) => {
    await page.goto('/budgeting');

    const развлеченияRow = getRow(page, 'Развлечения');
    const продуктыRow = getRow(page, 'Продукты');

    // Netflix (active, period=1) is due in April 2024 → badge visible
    const badge = getSubscriptionBadge(getPlanCell(развлеченияRow));
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('€15.99');

    // Tooltip shows header and subscription name; Кинопоиск (inactive) is absent
    const tooltip = await hoverBadge(badge);
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('€15.99 из подписок');
    await expect(tooltip).toContainText('Netflix');
    await expect(tooltip).not.toContainText('Кинопоиск');
    await expect(tooltip).not.toContainText('оплачено');

    // Яндекс Плюс (period=3, firstDate=2024-03-01) is not due in April 2024
    await expect(getSubscriptionBadge(getPlanCell(продуктыRow))).toHaveCount(0);

    // Click badge → no confirm needed for a single unlocked row → plan fills
    await badge.getByRole('button').click();
    await page.waitForLoadState('networkidle');
    await expect(getPlanCell(развлеченияRow)).toContainText('-€15.99');

    // Navigate back 4 months to December 2023 — monthly subs have firstDate 2024-01-01, not due yet
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: 'Previous' }).click();
    }
    await page.waitForLoadState('networkidle');
    await expect(
      getSubscriptionBadge(getPlanCell(getRow(page, 'Развлечения'))),
    ).toHaveCount(0);
  });

  test('paid subscription: shown with marker, counted in total', async ({
    page,
    seedData,
  }) => {
    await testPrisma.expense.create({
      data: {
        name: 'Netflix',
        cost: -15.99,
        date: new Date(TODAY_YEAR, TODAY_MONTH, TODAY_DAY),
        categoryId: seedData.categoryIds.развлечения,
        sourceId: seedData.sourceIds.вивид,
        subscriptionId: seedData.subscriptionIds.нетфликс,
        userId: seedData.userId,
      },
    });

    await page.goto('/budgeting');

    // Badge still present; total unchanged (paid subs counted)
    const badge = getSubscriptionBadge(
      getPlanCell(getRow(page, 'Развлечения')),
    );
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('€15.99');

    // Tooltip marks it as paid
    const tooltip = await hoverBadge(badge);
    await expect(tooltip).toContainText('Netflix (оплачено)');

    // Grand total badge total unchanged
    await expect(getGrandTotalBadge(page)).toContainText('€314.99');

    // Grand total tooltip also reflects paid status
    const grandTooltip = await hoverGrandTotalBadge(page);
    await expect(grandTooltip).toContainText('Netflix (оплачено)');
    await expect(grandTooltip).not.toContainText('Яндекс Такси (оплачено)');
  });

  test('subcategory row: placement, totals, click fills plan and propagates; locked category confirms', async ({
    page,
  }) => {
    await page.goto('/budgeting');

    const транспортRow = getRow(page, 'Транспорт');
    await expandRow(транспортRow);

    const такси = getRow(page, 'Такси');
    const остальное = getRow(page, 'Остальное');

    // Badge on Такси, not on Остальное; unlocked Транспорт category also has badge
    await expect(getSubscriptionBadge(getPlanCell(такси))).toBeVisible();
    await expect(getSubscriptionBadge(getPlanCell(остальное))).toHaveCount(0);
    await expect(getSubscriptionBadge(getPlanCell(транспортRow))).toBeVisible();

    // Both Такси and unlocked category show €299.00
    await expect(getSubscriptionBadge(getPlanCell(такси))).toContainText(
      '€299.00',
    );
    await expect(getSubscriptionBadge(getPlanCell(транспортRow))).toContainText(
      '€299.00',
    );

    // Click Такси badge → fills subcategory; rest unchanged; category total updated
    await getSubscriptionBadge(getPlanCell(такси)).getByRole('button').click();
    await page.waitForLoadState('networkidle');
    await expect(getPlanCell(такси)).toContainText('-€299.00');
    await expect(getPlanCell(остальное)).toContainText('€0.00');
    await expect(getPlanCell(транспортRow)).toContainText('-€299.00');

    // Category is now locked — clicking its badge requires confirmation
    await getSubscriptionBadge(getPlanCell(транспортRow))
      .getByRole('button')
      .click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await confirmFill(page);
    await expect(getPlanCell(такси)).toContainText('-€299.00');
  });

  test('typeGroup badge: correct total, click fills all rows in group', async ({
    page,
  }) => {
    await page.goto('/budgeting');

    const транспортRow = getRow(page, 'Транспорт');
    await expandRow(транспортRow);

    const расходыRow = getRow(page, 'Расходы');

    // Netflix(15.99) + Яндекс Такси(299.00) = 314.99
    await expect(getSubscriptionBadge(getPlanCell(расходыRow))).toContainText(
      '€314.99',
    );

    // Click → confirmation required for typeGroup
    await getSubscriptionBadge(getPlanCell(расходыRow))
      .getByRole('button')
      .click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await confirmFill(page);

    await expect(getPlanCell(getRow(page, 'Развлечения'))).toContainText(
      '-€15.99',
    );
    await expect(getPlanCell(getRow(page, 'Такси'))).toContainText('-€299.00');
  });

  test('grand total badge: correct total, grouped tooltip, click fills all rows', async ({
    page,
  }) => {
    await page.goto('/budgeting');

    const транспортRow = getRow(page, 'Транспорт');
    await expandRow(транспортRow);

    // Grand total = 15.99 + 299.00 = 314.99
    await expect(getGrandTotalBadge(page)).toContainText('€314.99');

    // Tooltip groups by source (both on Vivid)
    const tooltip = await hoverGrandTotalBadge(page);
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('€314.99 из подписок');
    await expect(tooltip).toContainText('Vivid');
    await expect(tooltip).toContainText('Netflix');
    await expect(tooltip).toContainText('Яндекс Такси');
    await expect(tooltip).not.toContainText('оплачено');

    // Click → confirmation → fills all rows
    await getGrandTotalBadge(page).getByRole('button').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await confirmFill(page);

    await expect(getPlanCell(getRow(page, 'Развлечения'))).toContainText(
      '-€15.99',
    );
    await expect(getPlanCell(getRow(page, 'Такси'))).toContainText('-€299.00');
  });

  test('category-level subscription (subcategoryId=null) appears on rest row, not on subcategory row', async ({
    page,
    seedData,
  }) => {
    // Add a subscription linked to Транспорт category but no subcategory
    await testPrisma.subscription.create({
      data: {
        name: 'Парковка',
        cost: 50,
        categoryId: seedData.categoryIds.транспорт,
        subcategoryId: null,
        sourceId: seedData.sourceIds.вивид,
        period: 1,
        firstDate: new Date('2024-01-01'),
        active: true,
        userId: seedData.userId,
      },
    });

    await page.goto('/budgeting');

    const транспортRow = getRow(page, 'Транспорт');
    await expandRow(транспортRow);

    const такси = getRow(page, 'Такси');
    const остальное = getRow(page, 'Остальное');

    // Парковка (subcategoryId=null) appears on Остальное only
    await expect(getSubscriptionBadge(getPlanCell(остальное))).toContainText(
      '€50.00',
    );

    // Такси badge only reflects its own subscription (Яндекс Такси), not Парковка
    await expect(getSubscriptionBadge(getPlanCell(такси))).toContainText(
      '€299.00',
    );

    // Category row total = Яндекс Такси (299) + Парковка (50)
    await expect(getSubscriptionBadge(getPlanCell(транспортRow))).toContainText(
      '€349.00',
    );

    // Click rest row badge → fills rest row plan; Такси unchanged
    await getSubscriptionBadge(getPlanCell(остальное))
      .getByRole('button')
      .click();
    await page.waitForLoadState('networkidle');
    await expect(getPlanCell(остальное)).toContainText('-€50.00');
    await expect(getPlanCell(такси)).toContainText('€0.00');
  });
});
