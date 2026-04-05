import { TODAY_MONTH, TODAY_YEAR } from '../../src/shared/utils/today';
import { testPrisma } from './client';

export const TEST_USER_ID = 'test-user';

export interface SeedData {
  userId: string;
  categoryIds: {
    продукты: number;
    транспорт: number;
    развлечения: number;
    изСбережений: number;
    вСбережения: number;
    зарплата: number;
  };
  subcategoryIds: {
    рынок: number;
    такси: number;
    основная: number;
  };
  sourceIds: {
    вивид: number;
  };
  subscriptionIds: {
    нетфликс: number;
  };
  savingSpendingIds: {
    отпускРим2025: number;
    переезд2026: number;
    новыйТелевизор: number;
  };
  savingSpendingCategoryIds: {
    общее: number;
    залог: number;
    транспорт: number;
    электроника: number;
  };
  forecastIds: {
    продукты: number;
  };
}

export async function seed(): Promise<SeedData> {
  const user = await testPrisma.user.create({
    data: { id: TEST_USER_ID },
  });

  // Categories
  const продукты = await testPrisma.category.create({
    data: {
      name: 'Продукты',
      shortname: 'Продукты',
      isIncome: false,
      isContinuous: false,
      userId: user.id,
    },
  });
  const рынок = await testPrisma.subcategory.create({
    data: { name: 'Рынок', categoryId: продукты.id },
  });

  const транспорт = await testPrisma.category.create({
    data: {
      name: 'Транспорт',
      shortname: 'Транспорт',
      isIncome: false,
      isContinuous: false,
      userId: user.id,
    },
  });
  const такси = await testPrisma.subcategory.create({
    data: { name: 'Такси', categoryId: транспорт.id },
  });

  const развлечения = await testPrisma.category.create({
    data: {
      name: 'Развлечения',
      shortname: 'Развлечения',
      isIncome: false,
      isContinuous: false,
      userId: user.id,
    },
  });

  const изСбережений = await testPrisma.category.create({
    data: {
      name: 'Из сбережений',
      shortname: 'Из сбережений',
      isIncome: false,
      isContinuous: false,
      type: 'FROM_SAVINGS',
      userId: user.id,
    },
  });

  const вСбережения = await testPrisma.category.create({
    data: {
      name: 'В сбережения',
      shortname: 'В сбережения',
      isIncome: false,
      isContinuous: false,
      type: 'TO_SAVINGS',
      userId: user.id,
    },
  });

  const зарплата = await testPrisma.category.create({
    data: {
      name: 'Зарплата',
      shortname: 'Зарплата',
      isIncome: true,
      isContinuous: false,
      userId: user.id,
    },
  });
  const основная = await testPrisma.subcategory.create({
    data: { name: 'Основная', categoryId: зарплата.id },
  });

  const expenseCategories = [
    продукты,
    транспорт,
    развлечения,
    изСбережений,
    вСбережения,
  ];
  const incomeCategories = [зарплата];

  await testPrisma.userSetting.create({
    data: {
      userId: user.id,
      expenseCategoriesOrder: expenseCategories.map((c) => c.id),
      incomeCategoriesOrder: incomeCategories.map((c) => c.id),
    },
  });

  // Source
  const vivid = await testPrisma.source.create({
    data: { name: 'Vivid', parser: 'VIVID', userId: user.id },
  });

  // Subscription
  const netflix = await testPrisma.subscription.create({
    data: {
      name: 'Netflix',
      cost: 15.99,
      categoryId: развлечения.id,
      sourceId: vivid.id,
      period: 30,
      firstDate: new Date('2024-01-01'),
      active: true,
      userId: user.id,
    },
  });

  // Forecasts
  // TODAY_MONTH is 0-indexed; DB month field is 1-indexed
  const продуктыForecast = await testPrisma.forecast.create({
    data: {
      categoryId: продукты.id,
      subcategoryId: null,
      month: TODAY_MONTH + 1,
      year: TODAY_YEAR,
      sum: 100,
      comment: '',
      userId: user.id,
    },
  });

  // Saving spending events
  const отпускРим = await testPrisma.savingSpending.create({
    data: {
      name: 'Отпуск Рим 2025',
      completed: false,
      userId: user.id,
      categories: {
        create: [{ name: 'Общее', forecast: 0, comment: '' }],
      },
    },
    include: { categories: true },
  });

  const переезд = await testPrisma.savingSpending.create({
    data: {
      name: 'Переезд 2026',
      completed: false,
      userId: user.id,
      categories: {
        create: [
          { name: 'Залог', forecast: 0, comment: '' },
          { name: 'Транспорт', forecast: 0, comment: '' },
        ],
      },
    },
    include: { categories: true },
  });

  const новыйТелевизор = await testPrisma.savingSpending.create({
    data: {
      name: 'Новый телевизор',
      completed: true,
      userId: user.id,
      categories: {
        create: [{ name: 'Электроника', forecast: 0, comment: '' }],
      },
    },
    include: { categories: true },
  });

  return {
    userId: user.id,
    categoryIds: {
      продукты: продукты.id,
      транспорт: транспорт.id,
      развлечения: развлечения.id,
      изСбережений: изСбережений.id,
      вСбережения: вСбережения.id,
      зарплата: зарплата.id,
    },
    subcategoryIds: {
      рынок: рынок.id,
      такси: такси.id,
      основная: основная.id,
    },
    sourceIds: {
      вивид: vivid.id,
    },
    subscriptionIds: {
      нетфликс: netflix.id,
    },
    savingSpendingIds: {
      отпускРим2025: отпускРим.id,
      переезд2026: переезд.id,
      новыйТелевизор: новыйТелевизор.id,
    },
    savingSpendingCategoryIds: {
      общее: отпускРим.categories[0]!.id,
      залог: переезд.categories[0]!.id,
      транспорт: переезд.categories[1]!.id,
      электроника: новыйТелевизор.categories[0]!.id,
    },
    forecastIds: {
      продукты: продуктыForecast.id,
    },
  };
}
