import type { TestCookie } from 'better-auth/plugins';

import { TODAY_MONTH, TODAY_YEAR } from '../../../src/shared/utils/today';
import { testPrisma } from './client';
import { testAuth } from './testAuth';

export const TEST_USER_ID = 'test-user';
export const TEST_PROJECT_ID = 'test-project';

export interface SeedData {
  userId: string;
  projectId: string;
  sessionCookies: TestCookie[];
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
    яндексТакси: number;
    яндексПлюс: number;
    кинопоиск: number;
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
  transactionIds: {
    транспортТекущийМесяц: number;
    транспортПрошлыйМесяц: number;
  };
}

export async function seed(): Promise<SeedData> {
  const project = await testPrisma.project.create({
    data: { id: TEST_PROJECT_ID, name: 'E2E Test Project' },
  });

  const ctx = await testAuth.$context;
  const user = ctx.test.createUser({
    id: TEST_USER_ID,
    email: 'test-admin@example.com',
    name: 'Test Admin',
    projectId: project.id,
    role: 'admin',
    emailVerified: true,
  });
  await ctx.test.saveUser(user);
  // Mark onboarding complete so the first-run tour doesn't auto-start and
  // overlay the UI in every spec. The onboarding spec opts back in explicitly.
  await testPrisma.user.update({
    where: { id: user.id },
    data: { onboardingCompletedAt: new Date() },
  });
  const { cookies: sessionCookies } = await ctx.test.login({
    userId: user.id,
  });

  // Categories
  const продукты = await testPrisma.category.create({
    data: {
      name: 'Продукты',
      shortname: 'Продукты',
      isIncome: false,
      isContinuous: false,
      projectId: project.id,
    },
  });
  const рынок = await testPrisma.subcategory.create({
    data: { name: 'Рынок', categoryId: продукты.id, projectId: project.id },
  });

  const транспорт = await testPrisma.category.create({
    data: {
      name: 'Транспорт',
      shortname: 'Транспорт',
      isIncome: false,
      isContinuous: false,
      projectId: project.id,
    },
  });
  const такси = await testPrisma.subcategory.create({
    data: { name: 'Такси', categoryId: транспорт.id, projectId: project.id },
  });

  const развлечения = await testPrisma.category.create({
    data: {
      name: 'Развлечения',
      shortname: 'Развлечения',
      isIncome: false,
      isContinuous: false,
      projectId: project.id,
    },
  });

  const изСбережений = await testPrisma.category.create({
    data: {
      name: 'Из сбережений',
      shortname: 'Из сбережений',
      isIncome: false,
      isContinuous: false,
      type: 'FROM_SAVINGS',
      projectId: project.id,
    },
  });

  const вСбережения = await testPrisma.category.create({
    data: {
      name: 'В сбережения',
      shortname: 'В сбережения',
      isIncome: false,
      isContinuous: false,
      type: 'TO_SAVINGS',
      projectId: project.id,
    },
  });

  const зарплата = await testPrisma.category.create({
    data: {
      name: 'Зарплата',
      shortname: 'Зарплата',
      isIncome: true,
      isContinuous: false,
      projectId: project.id,
    },
  });
  const основная = await testPrisma.subcategory.create({
    data: { name: 'Основная', categoryId: зарплата.id, projectId: project.id },
  });

  const expenseCategories = [
    продукты,
    транспорт,
    развлечения,
    изСбережений,
    вСбережения,
  ];
  const incomeCategories = [зарплата];

  // Source
  const vivid = await testPrisma.source.create({
    data: { name: 'Vivid', parser: 'VIVID', projectId: project.id },
  });

  await testPrisma.projectSetting.create({
    data: {
      projectId: project.id,
      expenseCategoriesOrder: expenseCategories.map((c) => c.id),
      incomeCategoriesOrder: incomeCategories.map((c) => c.id),
      sourcesOrder: [vivid.id],
    },
  });

  // Subscriptions
  const netflix = await testPrisma.subscription.create({
    data: {
      name: 'Netflix',
      cost: 15.99,
      categoryId: развлечения.id,
      sourceId: vivid.id,
      period: 1,
      firstDate: new Date('2024-01-01'),
      active: true,
      projectId: project.id,
    },
  });

  // Quarterly subscription on Продукты — NOT due in April 2024
  // Due schedule: Mar 2024, Jun 2024, Sep 2024… firstDate=2024-03-01, period=3
  const яндексПлюс = await testPrisma.subscription.create({
    data: {
      name: 'Яндекс Плюс',
      cost: 169,
      categoryId: продукты.id,
      sourceId: vivid.id,
      period: 3,
      firstDate: new Date('2024-03-01'),
      active: true,
      projectId: project.id,
    },
  });

  // Inactive subscription on Развлечения — should never appear in badges
  const кинопоиск = await testPrisma.subscription.create({
    data: {
      name: 'Кинопоиск',
      cost: 199,
      categoryId: развлечения.id,
      sourceId: vivid.id,
      period: 1,
      firstDate: new Date('2024-01-01'),
      active: false,
      projectId: project.id,
    },
  });

  // Subscription linked to Такси subcategory (period: 1 month, due every month)
  const таксиСервис = await testPrisma.subscription.create({
    data: {
      name: 'Яндекс Такси',
      cost: 299,
      categoryId: транспорт.id,
      subcategoryId: такси.id,
      sourceId: vivid.id,
      period: 1,
      firstDate: new Date('2024-01-01'),
      active: true,
      projectId: project.id,
    },
  });

  // Forecasts
  // TODAY_MONTH is 0-indexed; DB month field is also 0-indexed
  const продуктыForecast = await testPrisma.forecast.create({
    data: {
      categoryId: продукты.id,
      subcategoryId: null,
      month: TODAY_MONTH,
      year: TODAY_YEAR,
      sum: 100,
      comment: '',
      projectId: project.id,
    },
  });

  // Use ISO strings with noon UTC to avoid timezone-induced date shifts (e.g. Berlin UTC+1 turning
  // midnight local into the previous day in UTC, which then round-trips back incorrectly).
  // TODAY_MONTH is 0-based; 1-based current month = TODAY_MONTH + 1, last month = TODAY_MONTH.
  const currentMonthStr = String(TODAY_MONTH + 1).padStart(2, '0');
  const lastMonthStr =
    (TODAY_MONTH as number) === 0 ? '12' : String(TODAY_MONTH).padStart(2, '0');
  const lastMonthYear =
    TODAY_MONTH === (0 as number) ? TODAY_YEAR - 1 : TODAY_YEAR;

  const транспортТекущийМесяц = await testPrisma.expense.create({
    data: {
      name: 'Тест транспорт текущий',
      cost: 50,
      date: new Date(`${TODAY_YEAR}-${currentMonthStr}-01T12:00:00.000Z`),
      categoryId: транспорт.id,
      subcategoryId: null,
      projectId: project.id,
    },
  });

  const транспортПрошлыйМесяц = await testPrisma.expense.create({
    data: {
      name: 'Тест транспорт прошлый',
      cost: 30,
      date: new Date(`${lastMonthYear}-${lastMonthStr}-01T12:00:00.000Z`),
      categoryId: транспорт.id,
      subcategoryId: null,
      projectId: project.id,
    },
  });

  const отпускРим = await testPrisma.savingSpending.create({
    data: {
      name: 'Отпуск Рим 2025',
      completed: false,
      projectId: project.id,
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
      projectId: project.id,
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
      projectId: project.id,
      categories: {
        create: [{ name: 'Электроника', forecast: 0, comment: '' }],
      },
    },
    include: { categories: true },
  });

  return {
    userId: user.id,
    projectId: project.id,
    sessionCookies,
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
      яндексТакси: таксиСервис.id,
      яндексПлюс: яндексПлюс.id,
      кинопоиск: кинопоиск.id,
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
    transactionIds: {
      транспортТекущийМесяц: транспортТекущийМесяц.id,
      транспортПрошлыйМесяц: транспортПрошлыйМесяц.id,
    },
  };
}
