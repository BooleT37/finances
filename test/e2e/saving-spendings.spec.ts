import { expect, test } from './fixtures';
import { testPrisma } from './db/client';

/**
 * Returns the Mantine card element scoped to the event with the given name.
 * Mantine Card adds a stable `mantine-Card-root` class.
 */
function getCard(page: import('@playwright/test').Page, name: string) {
  return page
    .locator('.mantine-Card-root')
    .filter({ has: page.getByRole('heading', { name, level: 4 }) });
}

test.describe('Saving Spendings', () => {
  test('active events show on main page; archived show on archive page; unarchiving restores an event', async ({
    page,
    seedData,
  }) => {
    await page.goto('/savings-spendings');

    // Active page: only non-completed events
    await expect(
      page.getByRole('heading', { name: 'Отпуск Рим 2025', level: 4 }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Переезд 2026', level: 4 }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Новый телевизор', level: 4 }),
    ).not.toBeVisible();

    // Archive "Отпуск Рим 2025"
    await getCard(page, 'Отпуск Рим 2025')
      .getByRole('button', { name: 'Архивировать' })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Отпуск Рим 2025', level: 4 }),
    ).not.toBeVisible();

    // Archive page: completed events (seeded + freshly archived)
    await page.goto('/savings-spendings/archive');
    await expect(
      page.getByRole('heading', { name: 'Новый телевизор', level: 4 }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Отпуск Рим 2025', level: 4 }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Переезд 2026', level: 4 }),
    ).not.toBeVisible();

    // Unarchive "Отпуск Рим 2025"
    await getCard(page, 'Отпуск Рим 2025')
      .getByRole('button', { name: 'Разархивировать' })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Отпуск Рим 2025', level: 4 }),
    ).not.toBeVisible();

    // Back to main page — event is active again
    await page.goto('/savings-spendings');
    await expect(
      page.getByRole('heading', { name: 'Отпуск Рим 2025', level: 4 }),
    ).toBeVisible();
  });

  test('totals aggregate expenses across more than 2 years; grand total row sums all categories', async ({
    page,
    seedData,
  }) => {
    // Set meaningful forecast values for Переезд 2026's two categories
    await testPrisma.savingSpendingCategory.update({
      where: { id: seedData.savingSpendingCategoryIds.залог },
      data: { forecast: 300 },
    });
    await testPrisma.savingSpendingCategory.update({
      where: { id: seedData.savingSpendingCategoryIds.транспорт },
      data: { forecast: 500 },
    });

    // Залог: 100 (2022) + 200 (2023) + 150 (2024) = 450 → over budget (300)
    // Транспорт: 80 (2022) + 120 (2024) = 200 → under budget (500)
    // Grand total plan: 800, actual: 650 → under budget
    await testPrisma.expense.createMany({
      data: [
        {
          name: 'Залог 2022',
          cost: 100,
          date: new Date('2022-06-01T12:00:00Z'),
          categoryId: seedData.categoryIds.изСбережений,
          savingSpendingCategoryId: seedData.savingSpendingCategoryIds.залог,
          userId: seedData.userId,
        },
        {
          name: 'Залог 2023',
          cost: 200,
          date: new Date('2023-06-01T12:00:00Z'),
          categoryId: seedData.categoryIds.изСбережений,
          savingSpendingCategoryId: seedData.savingSpendingCategoryIds.залог,
          userId: seedData.userId,
        },
        {
          name: 'Залог 2024',
          cost: 150,
          date: new Date('2024-06-01T12:00:00Z'),
          categoryId: seedData.categoryIds.изСбережений,
          savingSpendingCategoryId: seedData.savingSpendingCategoryIds.залог,
          userId: seedData.userId,
        },
        {
          name: 'Транспорт 2022',
          cost: 80,
          date: new Date('2022-01-01T12:00:00Z'),
          categoryId: seedData.categoryIds.изСбережений,
          savingSpendingCategoryId:
            seedData.savingSpendingCategoryIds.транспорт,
          userId: seedData.userId,
        },
        {
          name: 'Транспорт 2024',
          cost: 120,
          date: new Date('2024-01-01T12:00:00Z'),
          categoryId: seedData.categoryIds.изСбережений,
          savingSpendingCategoryId:
            seedData.savingSpendingCategoryIds.транспорт,
          userId: seedData.userId,
        },
      ],
    });

    await page.goto('/savings-spendings');

    const переездCard = getCard(page, 'Переезд 2026');

    const залогRow = переездCard.getByRole('row').filter({ hasText: 'Залог' });
    await expect(залогRow.getByRole('cell').nth(1)).toHaveText('€300.00');
    await expect(залогRow.getByRole('cell').nth(2)).toHaveText('€450.00');
    // Over budget — actual is shown in red
    await expect(
      залогRow.getByRole('cell').nth(2).locator('span'),
    ).toHaveAttribute('style', /red/);

    const транспортRow = переездCard
      .getByRole('row')
      .filter({ hasText: 'Транспорт' });
    await expect(транспортRow.getByRole('cell').nth(1)).toHaveText('€500.00');
    await expect(транспортRow.getByRole('cell').nth(2)).toHaveText('€200.00');
    // Under budget — actual is not red
    await expect(
      транспортRow.getByRole('cell').nth(2).locator('span'),
    ).not.toHaveAttribute('style', /red/);

    // Grand total: plan=800, actual=650 — under budget, not red
    const totalRow = переездCard.getByRole('row').filter({ hasText: 'Итого' });
    await expect(totalRow.getByRole('cell').nth(1)).toHaveText('€800.00');
    await expect(totalRow.getByRole('cell').nth(2)).toHaveText('€650.00');
    await expect(
      totalRow.getByRole('cell').nth(2).locator('span'),
    ).not.toHaveAttribute('style', /red/);
  });

  test('creating an event with one category hides the category name column; editing to add categories shows all of them', async ({
    page,
  }) => {
    await page.goto('/savings-spendings');

    // Create new event with a single category
    await page.getByRole('button', { name: 'Новое событие' }).click();
    await page.getByLabel('Название события').fill('Тест поездка');
    // Blur triggers auto-fill of first category name
    await page.getByLabel('Название события').blur();
    await expect(page.getByLabel('Название категории')).toHaveValue(
      'Тест поездка',
    );
    // Set the plan for the single category
    await page.getByPlaceholder('0').fill('1000');
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Сохранить' })
      .click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Single category → "Категория" column header is hidden
    const newCard = getCard(page, 'Тест поездка');
    await expect(newCard).toBeVisible();
    await expect(
      newCard.getByRole('columnheader', { name: 'Категория' }),
    ).not.toBeVisible();
    await expect(
      newCard.getByRole('columnheader', { name: 'План' }),
    ).toBeVisible();
    await expect(
      newCard.getByRole('columnheader', { name: 'Факт' }),
    ).toBeVisible();

    // Edit the event and add a second category
    await newCard.getByRole('button', { name: 'Редактировать' }).click();
    await page.getByRole('button', { name: 'Добавить категорию' }).click();
    await page.getByPlaceholder('Название категории').last().fill('Квартира');
    await page.getByPlaceholder('0').last().fill('2000');
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Сохранить' })
      .click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Two categories → "Категория" column visible, both names appear as rows
    const updatedCard = getCard(page, 'Тест поездка');
    await expect(
      updatedCard.getByRole('columnheader', { name: 'Категория' }),
    ).toBeVisible();
    await expect(
      updatedCard.getByRole('cell', { name: 'Тест поездка' }),
    ).toBeVisible();
    await expect(
      updatedCard.getByRole('cell', { name: 'Квартира' }),
    ).toBeVisible();
  });

  test('deleting a category is disabled when the category has expenses attached', async ({
    page,
    seedData,
  }) => {
    // Link an expense to the Залог category of Переезд 2026
    await testPrisma.expense.create({
      data: {
        name: 'Залог первый взнос',
        cost: 500,
        date: new Date('2024-01-15T12:00:00Z'),
        categoryId: seedData.categoryIds.изСбережений,
        savingSpendingCategoryId: seedData.savingSpendingCategoryIds.залог,
        userId: seedData.userId,
      },
    });

    await page.goto('/savings-spendings');

    // Open edit modal for Переезд 2026 (seeded with Залог + Транспорт)
    await getCard(page, 'Переезд 2026')
      .getByRole('button', { name: 'Редактировать' })
      .click();

    const deleteButtons = page.getByRole('button', {
      name: 'Удалить категорию',
    });

    // Залог (first row, has expense) → delete is disabled
    await expect(deleteButtons.first()).toBeDisabled();

    // Транспорт (second row, no expenses) → delete is enabled
    await expect(deleteButtons.last()).not.toBeDisabled();

    // Tooltip on disabled button explains why
    await deleteButtons.first().hover({ force: true });
    await expect(page.getByText('Нельзя удалить: есть расходы')).toBeVisible();
  });
});
