import { createServerFn } from '@tanstack/react-start';
import dayjs from 'dayjs';

import { categorySchema } from '~/features/categories/schema';
import { prisma } from '~/server/db';
import { adaptCost } from '~/shared/utils/adaptCost';

import {
  comparisonCategoryDataSchema,
  type FetchComparisonDataInput,
  fetchComparisonDataInputSchema,
} from './schema';
import type { DatedTx } from './utils/aggregateComparisonData';
import { aggregateComparisonData } from './utils/aggregateComparisonData';

export const fetchComparisonData = createServerFn({ method: 'GET' })
  .inputValidator((input: FetchComparisonDataInput) =>
    fetchComparisonDataInputSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const period1 = {
      start: dayjs(data.period1.start),
      end: dayjs(data.period1.end),
    };
    const period2 = {
      start: dayjs(data.period2.start),
      end: dayjs(data.period2.end),
    };

    const [expenses, categories] = await Promise.all([
      prisma.expense.findMany({
        where: {
          OR: [
            {
              date: {
                gte: new Date(data.period1.start),
                lte: new Date(data.period1.end),
              },
            },
            {
              date: {
                gte: new Date(data.period2.start),
                lte: new Date(data.period2.end),
              },
            },
          ],
        },
        include: {
          category: true,
          components: { include: { category: true } },
        },
      }),
      prisma.category.findMany({ include: { subcategories: true } }),
    ]);

    const transactions: DatedTx[] = expenses.map((e) => ({
      date: dayjs(e.date),
      cost: adaptCost(e.cost, e.category.isIncome),
      categoryId: e.categoryId,
      subcategoryId: e.subcategoryId,
      components: e.components.map((c) => ({
        cost: adaptCost(c.cost, c.category.isIncome),
        categoryId: c.categoryId,
        subcategoryId: c.subcategoryId,
      })),
    }));

    return aggregateComparisonData(
      transactions,
      categories.map((c) => categorySchema.encode(c)),
      period1,
      period2,
    ).map((row) => comparisonCategoryDataSchema.encode(row));
  });
