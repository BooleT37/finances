import dayjs from 'dayjs';

import { DATE_FORMAT } from '../../src/shared/constants';
import { testPrisma } from './db/client';
import { expect, test } from './fixtures';

test.describe('Subscriptions inline editing', () => {
  test('editing name, price, date, and source inline updates the table and syncs the open sidebar form; deleting it keeps its transactions', async ({
    page,
    seedData,
  }) => {
    // Link a transaction to Netflix so the delete at the end exercises the
    // "keep the transaction, drop the link" path.
    const tx = await testPrisma.expense.create({
      data: {
        name: 'Netflix апрель',
        cost: 15.99,
        date: new Date('2024-04-10T12:00:00Z'),
        categoryId: seedData.categoryIds.развлечения,
        subscriptionId: seedData.subscriptionIds.нетфликс,
        projectId: seedData.projectId,
      },
    });

    await page.goto('/settings/subscriptions');

    const row = page.locator('tr', { hasText: 'Netflix' });
    // Once a cell enters edit mode, its value moves from text content into
    // an input, so a `hasText`-based row locator can stop matching on
    // re-evaluation. Scope editors to the table instead, which is stable
    // across the edit-mode transition — the sidebar form lives outside it.
    const table = page.locator('table');

    // Open the sidebar on this same subscription so we can verify inline
    // edits keep it in sync, not just the table.
    await row.getByRole('button', { name: 'Редактировать' }).click();
    const form = page.getByRole('form', { name: 'Форма подписки' });

    // --- Name ---
    await row.getByText('Netflix').click();
    await table
      .getByRole('textbox', { name: 'Название', exact: true })
      .fill('Netflix 2');
    await page.keyboard.press('Enter');
    await expect(row.getByText('Netflix 2')).toBeVisible();
    // Mantine's labeling here isn't associated in a way `getByLabel` picks
    // up — use `getByRole` with the same accessible name instead.
    await expect(
      form.getByRole('textbox', { name: 'Название', exact: true }),
    ).toHaveValue('Netflix 2');

    // --- Price ---
    await row.getByText('€15.99 / мес.').click();
    await table.getByRole('textbox', { name: 'Цена', exact: true }).fill('20');
    await page.keyboard.press('Enter');
    await expect(row.getByText('€20.00 / мес.')).toBeVisible();
    // Netflix belongs to an expense category, so the sidebar's raw `cost`
    // field is signed negative even though the table always shows the abs value.
    await expect(
      form.getByRole('textbox', { name: 'Цена', exact: true }),
    ).toHaveValue('-20');

    // --- Date ---
    const firstDate = dayjs('2024-01-01');
    const targetDay = 10;
    const targetDate = firstDate.date(targetDay);
    await row.getByText(firstDate.format(DATE_FORMAT)).click();
    await page
      .locator('button:not([data-direction]):not([data-outside])', {
        hasText: new RegExp(`^${targetDay}$`),
      })
      .first()
      .click();
    await expect(row.getByText(targetDate.format(DATE_FORMAT))).toBeVisible();
    await expect(form.getByRole('button', { name: 'Дата начала' })).toHaveText(
      targetDate.format(DATE_FORMAT),
    );

    // --- Source ---
    // Scoped to `row` — the sidebar's own Источник field is also on screen.
    await row.getByText('Vivid').click();
    await row.getByRole('combobox', { name: 'Источник' }).click();
    await page.getByRole('option', { name: 'Vivid' }).click();
    await expect(row.getByText('Vivid')).toBeVisible();
    await expect(form.getByRole('combobox', { name: 'Источник' })).toHaveValue(
      'Vivid',
    );

    // --- Deleting a subscription that a transaction still points at ---
    await row.getByRole('button', { name: 'Удалить' }).click();
    // The confirm button carries the same label as the row action, so scope
    // it to the dialog.
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Удалить' })
      .click();
    await page.waitForLoadState('networkidle');

    await expect
      .poll(() =>
        testPrisma.subscription.count({
          where: { id: seedData.subscriptionIds.нетфликс },
        }),
      )
      .toBe(0);

    // The transaction survived, just unlinked — it must not have been blocked
    // by the FK or deleted along with the subscription.
    const kept = await testPrisma.expense.findUnique({ where: { id: tx.id } });
    expect(kept).not.toBeNull();
    expect(kept?.subscriptionId).toBeNull();
    expect(kept?.categoryId).toBe(seedData.categoryIds.развлечения);
  });

  test('inline editing an invalid price value is not saved', async ({
    page,
  }) => {
    await page.goto('/settings/subscriptions');

    const row = page.locator('tr', { hasText: 'Netflix' });
    const table = page.locator('table');

    await row.getByText('€15.99 / мес.').click();
    const input = table.getByRole('textbox', { name: 'Цена', exact: true });
    await input.fill('not-a-number');
    await expect(input).toHaveAttribute('aria-invalid', 'true');

    // Escape discards the invalid draft instead of saving it.
    await page.keyboard.press('Escape');
    await expect(row.getByText('€15.99 / мес.')).toBeVisible();
  });
});

test.describe('Subscriptions add sidebar', () => {
  test('category tree select is interactive on the very first page load', async ({
    page,
  }) => {
    // The sidebar (and its category TreeSelect) is always mounted, just
    // translated off-screen when closed — so it's part of every fresh
    // server render of this page, not just when a user opens it.
    await page.goto('/settings/subscriptions');
    await page.getByRole('button', { name: 'Добавить подписку' }).click();

    const categorySelect = page.locator('.treeSelect');
    await expect(categorySelect).toBeVisible();
    await categorySelect.click();
    await expect(page.locator('.treeSelectDropdown')).toBeVisible();
  });
});
