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
  sourceId: number;
  subscriptionId: number;
  savingSpendingIds: {
    eventA: number;
    eventB: number;
    eventC: number;
  };
  savingSpendingCategoryIds: {
    eventAGeneral: number;
    eventBDeposit: number;
    eventBTransport: number;
    eventCElectronics: number;
  };
}

export async function seed(): Promise<SeedData> {
  const user = await testPrisma.user.create({
    data: { id: TEST_USER_ID },
  });

  // Categories
  const продукты = await testPrisma.category.create({
    data: { name: 'Продукты', shortname: 'Продукты', isIncome: false, isContinuous: false, userId: user.id },
  });
  const рынок = await testPrisma.subcategory.create({
    data: { name: 'Рынок', categoryId: продукты.id },
  });

  const транспорт = await testPrisma.category.create({
    data: { name: 'Транспорт', shortname: 'Транспорт', isIncome: false, isContinuous: false, userId: user.id },
  });
  const такси = await testPrisma.subcategory.create({
    data: { name: 'Такси', categoryId: транспорт.id },
  });

  const развлечения = await testPrisma.category.create({
    data: { name: 'Развлечения', shortname: 'Развлечения', isIncome: false, isContinuous: false, userId: user.id },
  });

  const изСбережений = await testPrisma.category.create({
    data: { name: 'Из сбережений', shortname: 'Из сбережений', isIncome: false, isContinuous: false, type: 'FROM_SAVINGS', userId: user.id },
  });

  const вСбережения = await testPrisma.category.create({
    data: { name: 'В сбережения', shortname: 'В сбережения', isIncome: false, isContinuous: false, type: 'TO_SAVINGS', userId: user.id },
  });

  const зарплата = await testPrisma.category.create({
    data: { name: 'Зарплата', shortname: 'Зарплата', isIncome: true, isContinuous: false, userId: user.id },
  });
  const основная = await testPrisma.subcategory.create({
    data: { name: 'Основная', categoryId: зарплата.id },
  });

  const expenseCategories = [продукты, транспорт, развлечения, изСбережений, вСбережения];
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

  // Saving spending events
  const eventA = await testPrisma.savingSpending.create({
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

  const eventB = await testPrisma.savingSpending.create({
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

  const eventC = await testPrisma.savingSpending.create({
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
    sourceId: vivid.id,
    subscriptionId: netflix.id,
    savingSpendingIds: {
      eventA: eventA.id,
      eventB: eventB.id,
      eventC: eventC.id,
    },
    savingSpendingCategoryIds: {
      eventAGeneral: eventA.categories[0]!.id,
      eventBDeposit: eventB.categories[0]!.id,
      eventBTransport: eventB.categories[1]!.id,
      eventCElectronics: eventC.categories[0]!.id,
    },
  };
}
