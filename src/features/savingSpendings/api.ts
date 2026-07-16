import { createServerFn } from '@tanstack/react-start';
import Decimal from 'decimal.js';

import { authMiddleware } from '~/middlewares/authMiddleware';
import { prisma } from '~/server/db';
import { assertOwnedByProject } from '~/shared/utils/assertOwnedByProject';

import {
  type CreateSavingSpendingInput,
  createSavingSpendingSchema,
  savingSpendingSchema,
  type UpdateSavingSpendingInput,
  updateSavingSpendingSchema,
} from './schema';

export const fetchAllSavingSpendings = createServerFn({
  method: 'GET',
})
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const [savingSpendings, actuals] = await Promise.all([
      prisma.savingSpending.findMany({
        where: { projectId: context.projectId },
        include: { categories: true },
      }),
      prisma.expense.groupBy({
        by: ['savingSpendingCategoryId'],
        _sum: { cost: true },
        _count: { _all: true },
        where: {
          projectId: context.projectId,
          savingSpendingCategoryId: { not: null },
        },
      }),
    ]);

    const actualMap = new Map(
      actuals.map((r) => [
        r.savingSpendingCategoryId,
        new Decimal(r._sum.cost?.toString() ?? '0'),
      ]),
    );
    // Count, not sum: a category summing to zero still has expenses.
    const expensesCountMap = new Map(
      actuals.map((r) => [r.savingSpendingCategoryId, r._count._all]),
    );

    return savingSpendings.map((s) =>
      savingSpendingSchema.encode({
        ...s,
        categories: s.categories.map((cat) => ({
          ...cat,
          actual: actualMap.get(cat.id) ?? new Decimal(0),
          expensesCount: expensesCountMap.get(cat.id) ?? 0,
        })),
      }),
    );
  });

export const createSavingSpending = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((input: CreateSavingSpendingInput) =>
    createSavingSpendingSchema.parse(input),
  )
  .handler(async ({ data, context }) => {
    await prisma.savingSpending.create({
      data: {
        name: data.name,
        completed: false,
        projectId: context.projectId,
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
  .middleware([authMiddleware])
  .inputValidator((input: UpdateSavingSpendingInput) =>
    updateSavingSpendingSchema.parse(input),
  )
  .handler(async ({ data, context }) => {
    const { id, name, categories } = data;

    await assertOwnedByProject(
      prisma.savingSpending,
      id,
      context.projectId,
      'Saving spending',
    );

    await prisma.$transaction(async (db) => {
      const keptIds = categories
        .filter((c) => c.id !== undefined)
        .map((c) => c.id!);

      // The form disables this, but the rule must hold for direct RPC calls.
      const removedWithExpenses = await db.savingSpendingCategory.findFirst({
        where: {
          savingSpendingId: id,
          projectId: context.projectId,
          id: { notIn: keptIds },
          expenses: { some: {} },
        },
        select: { name: true },
      });
      if (removedWithExpenses) {
        throw new Error(
          `Cannot remove category '${removedWithExpenses.name}' because it has expenses attached`,
        );
      }

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
  .middleware([authMiddleware])
  .inputValidator((id: number) => id)
  .handler(async ({ data: id, context }) => {
    await assertOwnedByProject(
      prisma.savingSpending,
      id,
      context.projectId,
      'Saving spending',
    );

    await prisma.$transaction(async (tx) => {
      // Cascades to its categories, so the same rule applies.
      const categoryWithExpenses = await tx.savingSpendingCategory.findFirst({
        where: {
          savingSpendingId: id,
          projectId: context.projectId,
          expenses: { some: {} },
        },
        select: { name: true },
      });
      if (categoryWithExpenses) {
        throw new Error(
          `Cannot delete this saving spending because its category '${categoryWithExpenses.name}' has expenses attached`,
        );
      }

      await tx.savingSpending.delete({ where: { id } });
    });
  });

export const archiveSavingSpending = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((id: number) => id)
  .handler(async ({ data: id, context }) => {
    await assertOwnedByProject(
      prisma.savingSpending,
      id,
      context.projectId,
      'Saving spending',
    );
    await prisma.savingSpending.update({
      where: { id },
      data: { completed: true },
    });
  });

export const unarchiveSavingSpending = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((id: number) => id)
  .handler(async ({ data: id, context }) => {
    await assertOwnedByProject(
      prisma.savingSpending,
      id,
      context.projectId,
      'Saving spending',
    );
    await prisma.savingSpending.update({
      where: { id },
      data: { completed: false },
    });
  });
