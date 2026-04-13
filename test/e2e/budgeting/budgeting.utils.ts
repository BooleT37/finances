import type { Locator, Page } from '@playwright/test';

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
  await getPlanCell(row).dblclick();
  await row.locator('input[type="number"]').fill(value);
  await row.locator('input[type="number"]').press('Enter');
}

export async function editCommentCell(row: Locator, value: string) {
  await getCommentCell(row).dblclick();
  await getCommentCell(row).locator('input').fill(value);
  await getCommentCell(row).locator('input').press('Enter');
}
