import { expect, test } from '../fixtures';
import {
  expandRow,
  fillBreakdownRow,
  getBreakdownIcon,
  getBreakdownModal,
  getPlanCell,
  getRemovePlanConfirm,
  getRow,
  openBreakdownFromEditor,
} from './budgeting.spec.utils';

test.describe('Budgeting composite plan', () => {
  test('builds a plan from a formula, locks the cell, and persists', async ({
    page,
  }) => {
    await page.goto('/budgeting');
    const транспортRow = getRow(page, 'Транспорт');

    await openBreakdownFromEditor(транспортRow);
    const modal = getBreakdownModal(page);
    await expect(modal).toBeVisible();

    // The price is a formula: 12+8 = 20, three of them = 60.
    await fillBreakdownRow(modal, 0, {
      price: '12+8',
      quantity: '3',
      comment: 'Проездной',
    });
    await expect(modal.getByTestId('breakdown-total')).toHaveText(
      'Итого: €60.00',
    );

    await modal.getByRole('button', { name: 'Сохранить' }).click();
    await expect(modal).toBeHidden();

    await expect(getPlanCell(транспортRow)).toContainText('-€60.00');
    await expect(getBreakdownIcon(транспортRow)).toBeVisible();

    // The value now comes from the plan, so the cell no longer takes typing.
    await getPlanCell(транспортRow).click();
    await expect(транспортRow.locator('input[type="number"]')).toHaveCount(0);

    await page.reload();
    await expect(getPlanCell(транспортRow)).toContainText('-€60.00');
    await expect(getBreakdownIcon(транспортRow)).toBeVisible();
  });

  test('refuses a non-positive total and an unparseable formula', async ({
    page,
  }) => {
    await page.goto('/budgeting');
    const продуктыRow = getRow(page, 'Продукты');

    await openBreakdownFromEditor(продуктыRow);
    const modal = getBreakdownModal(page);
    const save = modal.getByRole('button', { name: 'Сохранить' });

    // Nothing entered yet: the complaint only appears once you try to save.
    await expect(modal.getByText('Итог должен быть больше нуля')).toBeHidden();
    await save.click();
    await expect(modal.getByText('Итог должен быть больше нуля')).toBeVisible();
    await expect(modal).toBeVisible();

    await fillBreakdownRow(modal, 0, { price: '12+' });
    await expect(modal.getByTestId('breakdown-total')).toHaveText(
      'Итого: €0.00',
    );
    await save.click();
    await expect(modal.getByText('Неверная формула')).toBeVisible();
    await expect(modal).toBeVisible();

    // A discount line may go negative as long as the total does not.
    await fillBreakdownRow(modal, 0, { price: '100' });
    await modal.getByRole('button', { name: 'Добавить строку' }).click();
    await fillBreakdownRow(modal, 1, { price: '-120' });
    await expect(modal.getByTestId('breakdown-total')).toHaveText(
      'Итого: -€20.00',
    );
    await save.click();
    await expect(modal.getByText('Итог должен быть больше нуля')).toBeVisible();

    await fillBreakdownRow(modal, 1, { price: '-20' });
    await expect(modal.getByTestId('breakdown-total')).toHaveText(
      'Итого: €80.00',
    );
    await save.click();
    await expect(modal).toBeHidden();
    await expect(getPlanCell(продуктыRow)).toContainText('-€80.00');
  });

  test('keeps the formula text, previews the plan on hover, and keeps the sum when removed', async ({
    page,
  }) => {
    await page.goto('/budgeting');
    const продуктыRow = getRow(page, 'Продукты');

    await openBreakdownFromEditor(продуктыRow);
    const modal = getBreakdownModal(page);
    await fillBreakdownRow(modal, 0, {
      price: '12+8',
      quantity: '3',
      comment: 'Проездной',
    });
    await expect(modal.getByTestId('breakdown-total')).toHaveText(
      'Итого: €60.00',
    );
    await modal.getByRole('button', { name: 'Сохранить' }).click();
    await expect(modal).toBeHidden();

    // Reopening shows what was typed, not the number it evaluated to.
    await getBreakdownIcon(продуктыRow).click();
    const reopened = getBreakdownModal(page);
    await expect(reopened.locator('input').first()).toHaveValue('12+8');
    await page.keyboard.press('Escape');
    await expect(reopened).toBeHidden();

    await getBreakdownIcon(продуктыRow).hover();
    const preview = page.getByTestId('breakdown-tooltip');
    await expect(preview).toContainText('Проездной');
    await expect(preview).toContainText('€60.00');
    await expect(preview).toContainText('12+8 × 3 шт');

    await getBreakdownIcon(продуктыRow).click();
    await getBreakdownModal(page)
      .getByRole('button', { name: 'Удалить составной план' })
      .click();

    const confirm = getRemovePlanConfirm(page);
    await expect(confirm).toBeVisible();
    await confirm
      .getByRole('button', { name: 'Удалить составной план' })
      .click();

    // Removing the plan drops the line items but leaves the value it produced.
    await expect(getBreakdownIcon(продуктыRow)).toBeHidden();
    await expect(getPlanCell(продуктыRow)).toContainText('-€60.00');
    await page.reload();
    await expect(getPlanCell(продуктыRow)).toContainText('-€60.00');
    await expect(getBreakdownIcon(продуктыRow)).toBeHidden();
  });

  test('a category plan disables its subcategory rows', async ({ page }) => {
    await page.goto('/budgeting');
    const продуктыRow = getRow(page, 'Продукты');

    await expandRow(продуктыRow);
    const рынокRow = getRow(page, 'Рынок');
    await expect(рынокRow).toBeVisible();

    // Editable while the category has no plan of its own.
    await getPlanCell(рынокRow).click();
    await expect(рынокRow.locator('input[type="number"]')).toBeVisible();
    await page.keyboard.press('Escape');

    await openBreakdownFromEditor(продуктыRow);
    const modal = getBreakdownModal(page);
    await fillBreakdownRow(modal, 0, { price: '50', quantity: '2' });
    await expect(modal.getByTestId('breakdown-total')).toHaveText(
      'Итого: €100.00',
    );
    await modal.getByRole('button', { name: 'Сохранить' }).click();
    await expect(modal).toBeHidden();
    await expect(getPlanCell(продуктыRow)).toContainText('-€100.00');

    // Splitting by subcategory and a category plan can't both own the total.
    await getPlanCell(рынокRow).click();
    await expect(рынокRow.locator('input[type="number"]')).toHaveCount(0);
    await expect(getBreakdownIcon(рынокRow)).toBeHidden();
  });
});
