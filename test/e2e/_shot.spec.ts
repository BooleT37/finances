import { test } from './fixtures';

const DIR =
  '/private/tmp/claude-501/-Users-alekseylevin-projects-finances/0aaa969a-e9b9-4689-b00b-3ab13b80cd8b/scratchpad';

test('capture statistics full-page target popover', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/statistics');
  await page
    .getByRole('button', { name: 'Показать обзор этой страницы' })
    .click();
  await page.getByText('Здесь вы можете сравнить').waitFor();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${DIR}/statistics-fullpage-target.png` });
  await page.screenshot({
    path: `${DIR}/statistics-fullpage-target-full.png`,
    fullPage: true,
  });
});

test('capture transactions from-savings target', async ({ page }) => {
  await page.goto('/transactions');
  await page
    .getByRole('button', { name: 'Показать обзор этой страницы' })
    .click();
  await page.getByText('Здесь вводится список расходов').waitFor();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${DIR}/tx-step1-sidebar-open.png` });
  await page.getByRole('button', { name: 'Далее' }).click();
  await page.getByText('При добавлении расхода можно выбрать').waitFor();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${DIR}/tx-step2-from-savings.png` });
});
