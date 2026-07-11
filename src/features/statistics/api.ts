import { createServerFn } from '@tanstack/react-start';
import dayjs from 'dayjs';

import { categorySchema } from '~/features/categories/schema';
import { Prisma } from '~/generated/prisma/client';
import { authMiddleware } from '~/middlewares/authMiddleware';
import { prisma } from '~/server/db';
import { adaptCost } from '~/shared/utils/adaptCost';

import {
  comparisonCategoryDataSchema,
  dynamicsMonthDataSchema,
  type FetchComparisonDataInput,
  fetchComparisonDataInputSchema,
  type FetchDynamicsDataInput,
  fetchDynamicsDataInputSchema,
} from './schema';
import type { DatedTx } from './utils/aggregateComparisonData';
import { aggregateComparisonData } from './utils/aggregateComparisonData';
import { aggregateDynamicsData } from './utils/aggregateDynamicsData';

type ExpenseWithComponents = Prisma.ExpenseGetPayload<{
  include: { category: true; components: { include: { category: true } } };
}>;

function toDatedTx(e: ExpenseWithComponents): DatedTx {
  return {
    date: dayjs(e.date),
    cost: adaptCost(e.cost, e.category.isIncome),
    categoryId: e.categoryId,
    subcategoryId: e.subcategoryId,
    components: e.components.map((c) => ({
      cost: adaptCost(c.cost, c.category.isIncome),
      categoryId: c.categoryId,
      subcategoryId: c.subcategoryId,
    })),
  };
}

export const fetchComparisonData = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((input: FetchComparisonDataInput) =>
    fetchComparisonDataInputSchema.parse(input),
  )
  .handler(async ({ data, context }) => {
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
          projectId: context.projectId,
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
      prisma.category.findMany({
        where: { projectId: context.projectId },
        include: { subcategories: true },
      }),
    ]);

    return aggregateComparisonData(
      expenses.map(toDatedTx),
      categories.map((c) => categorySchema.encode(c)),
      period1,
      period2,
    ).map((row) => comparisonCategoryDataSchema.encode(row));
  });

export const fetchDynamicsData = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((input: FetchDynamicsDataInput) =>
    fetchDynamicsDataInputSchema.parse(input),
  )
  .handler(async ({ data, context }) => {
    const [expenses, categories] = await Promise.all([
      prisma.expense.findMany({
        where: {
          projectId: context.projectId,
          date: { gte: new Date(data.from), lte: new Date(data.to) },
        },
        include: {
          category: true,
          components: { include: { category: true } },
        },
      }),
      prisma.category.findMany({
        where: { projectId: context.projectId },
        include: { subcategories: true },
      }),
    ]);

    return aggregateDynamicsData(
      expenses.map(toDatedTx),
      categories.map((c) => categorySchema.encode(c)),
      dayjs(data.from),
      dayjs(data.to),
      data.categoryIds,
    ).map((row) => dynamicsMonthDataSchema.encode(row));
  });
