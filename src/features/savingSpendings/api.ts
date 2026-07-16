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

      const removedIds = (
        await db.savingSpendingCategory.findMany({
          where: { savingSpendingId: id, id: { notIn: keptIds } },
          select: { id: true },
        })
      ).map((c) => c.id);

      if (removedIds.length > 0) {
        // Composite FK (savingSpendingCategoryId, projectId) can't use
        // onDelete: SetNull — projectId is required, so the DB can't null just
        // one column. Null it out explicitly before deleting the categories.
        await db.expense.updateMany({
          where: {
            savingSpendingCategoryId: { in: removedIds },
            projectId: context.projectId,
          },
          data: { savingSpendingCategoryId: null },
        });
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
      // Deleting the saving spending cascades to its categories, but Expense's
      // composite FK (savingSpendingCategoryId, projectId) is Restrict — it
      // can't null just one column since projectId is required — so that
      // cascade is blocked while any expense still points at a category.
      const categoryIds = (
        await tx.savingSpendingCategory.findMany({
          where: { savingSpendingId: id, projectId: context.projectId },
          select: { id: true },
        })
      ).map((c) => c.id);

      if (categoryIds.length > 0) {
        await tx.expense.updateMany({
          where: {
            savingSpendingCategoryId: { in: categoryIds },
            projectId: context.projectId,
          },
          data: { savingSpendingCategoryId: null },
        });
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
