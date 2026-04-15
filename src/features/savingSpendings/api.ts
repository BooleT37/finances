import { createServerFn } from '@tanstack/react-start';
import Decimal from 'decimal.js';

import { prisma } from '~/server/db';

import {
  type CreateSavingSpendingInput,
  createSavingSpendingSchema,
  savingSpendingSchema,
  type UpdateSavingSpendingInput,
  updateSavingSpendingSchema,
} from './schema';

export const fetchAllSavingSpendings = createServerFn({
  method: 'GET',
}).handler(async () => {
  const [savingSpendings, actuals] = await Promise.all([
    prisma.savingSpending.findMany({ include: { categories: true } }),
    prisma.expense.groupBy({
      by: ['savingSpendingCategoryId'],
      _sum: { cost: true },
      where: { savingSpendingCategoryId: { not: null } },
    }),
  ]);

  const actualMap = new Map(
    actuals.map((r) => [
      r.savingSpendingCategoryId,
      new Decimal(r._sum.cost?.toString() ?? '0'),
    ]),
  );

  return savingSpendings.map((s) =>
    savingSpendingSchema.encode({
      ...s,
      categories: s.categories.map((cat) => ({
        ...cat,
        actual: actualMap.get(cat.id) ?? new Decimal(0),
      })),
    }),
  );
});

// TODO: replace userId with actual user from auth once auth is implemented
export const createSavingSpending = createServerFn({ method: 'POST' })
  .inputValidator((input: CreateSavingSpendingInput) =>
    createSavingSpendingSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const user = await prisma.user.findFirstOrThrow();
    await prisma.savingSpending.create({
      data: {
        name: data.name,
        completed: false,
        userId: user.id,
        categories: {
          createMany: {
            data: data.categories.map((cat) => ({
              name: cat.name,
              forecast: new Decimal(cat.forecast),
              comment: cat.comment,
            })),
          },
        },
      },
    });
  });

export const updateSavingSpending = createServerFn({ method: 'POST' })
  .inputValidator((input: UpdateSavingSpendingInput) =>
    updateSavingSpendingSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const { id, name, categories } = data;

    await prisma.$transaction(async (db) => {
      const keptIds = categories
        .filter((c) => c.id !== undefined)
        .map((c) => c.id!);

      await db.savingSpendingCategory.deleteMany({
        where: { savingSpendingId: id, id: { notIn: keptIds } },
      });

      await db.savingSpending.update({
        where: { id },
        data: {
          name,
          categories: {
            updateMany: categories
              .filter((c) => c.id !== undefined)
              .map((c) => ({
                where: { id: c.id! },
                data: {
                  name: c.name,
                  forecast: new Decimal(c.forecast),
                  comment: c.comment,
                },
              })),
            createMany: {
              data: categories
                .filter((c) => c.id === undefined)
                .map((c) => ({
                  name: c.name,
                  forecast: new Decimal(c.forecast),
                  comment: c.comment,
                })),
            },
          },
        },
      });
    });
  });

export const deleteSavingSpending = createServerFn({ method: 'POST' })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    await prisma.savingSpending.delete({ where: { id } });
  });

export const archiveSavingSpending = createServerFn({ method: 'POST' })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    await prisma.savingSpending.update({
      where: { id },
      data: { completed: true },
    });
  });

export const unarchiveSavingSpending = createServerFn({ method: 'POST' })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    await prisma.savingSpending.update({
      where: { id },
      data: { completed: false },
    });
  });
