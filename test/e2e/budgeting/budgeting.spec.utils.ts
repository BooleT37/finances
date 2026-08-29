import type { Locator, Page } from '@playwright/test';

import { expect } from '../fixtures';

export function getRow(page: Page, name: string) {
  return page.locator('tbody tr').filter({ hasText: name }).first();
}

export function getPlanCell(row: Locator) {
  return row.locator('[data-testing-column="plan"]');
}

export function getCommentCell(row: Locator) {
  return row.locator('[data-testing-column="comment"]');
}

export function getActualCell(
  row: Locator,
  col: 'thisMonth' | 'lastMonth' | 'average',
) {
  return row.locator(`[data-testing-column="${col}"]`);
}

export function expandRow(row: Locator) {
  return row.getByRole('button').first().click();
}

export async function editPlanCell(row: Locator, value: string) {
  await getPlanCell(row).click();
  await row.locator('input[type="number"]').fill(value);
  await row.locator('input[type="number"]').press('Enter');
}

export async function editCommentCell(row: Locator, value: string) {
  await getCommentCell(row).click();
  await getCommentCell(row).locator('input').fill(value);
  await getCommentCell(row).locator('input').press('Enter');
}

/** The composite plan modal, told apart from the confirm dialog by its total. */
export function getBreakdownModal(page: Page) {
  return page
    .locator('.mantine-Modal-content')
    .filter({ has: page.getByTestId('breakdown-total') });
}

export function getRemovePlanConfirm(page: Page) {
  return page
    .locator('.mantine-Modal-content')
    .filter({ hasText: 'Продолжить?' });
}

/** The calculator shown beside the value of a cell that already has a plan. */
export function getBreakdownIcon(row: Locator) {
  return getPlanCell(row).getByTestId('breakdown-icon');
}

/** Opens the plan through the calculator inside the cell's edit input. */
export async function openBreakdownFromEditor(row: Locator) {
  await getPlanCell(row).click();
  await getPlanCell(row).getByTestId('breakdown-icon-edit').click();
}

/**
 * Types rather than fills: these inputs are controlled by Mantine's form, and a
 * one-shot fill can be swallowed when React re-renders mid-set, leaving the
 * field on its previous value.
 */
async function typeInto(input: Locator, value: string) {
  await input.fill('');
  await input.pressSequentially(value);
  await expect(input).toHaveValue(value);
}

export async function fillBreakdownRow(
  modal: Locator,
  index: number,
  values: { price: string; quantity?: string; comment?: string },
) {
  const inputs = modal.locator('input');
  await typeInto(inputs.nth(index * 3), values.price);
  if (values.quantity !== undefined) {
    await typeInto(inputs.nth(index * 3 + 1), values.quantity);
  }
  if (values.comment !== undefined) {
    await typeInto(inputs.nth(index * 3 + 2), values.comment);
  }
}
