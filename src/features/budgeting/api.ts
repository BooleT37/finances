import { createServerFn } from '@tanstack/react-start';
import Decimal from 'decimal.js';
import { z } from 'zod';

import { type Prisma } from '~/generated/prisma/client';
import { authMiddleware } from '~/middlewares/authMiddleware';
import { prisma } from '~/server/db';
import { adaptCost } from '~/shared/utils/adaptCost';

import { forecastSchema } from './schema';

export const fetchForecastsByYear = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((year: number) => year)
  .handler(async ({ data: year, context }) => {
    const forecasts = await prisma.forecast.findMany({
      where: { year, projectId: context.projectId },
      include: { category: true },
    });
    return forecasts.map((f) =>
      forecastSchema.encode({
        ...f,
        sum: adaptCost(f.sum, f.category.isIncome),
      }),
    );
  });

type ForecastKey = {
  categoryId: number;
  month: number;
  year: number;
  projectId: string;
};

async function findChildren(tx: Prisma.TransactionClient, key: ForecastKey) {
  return tx.forecast.findMany({
    where: { ...key, level: 'SUBCATEGORY' },
  });
}

async function findOrCreateCategoryRow(
  tx: Prisma.TransactionClient,
  key: ForecastKey,
) {
  const existing = await tx.forecast.findFirst({
    where: { ...key, subcategoryId: null, level: 'CATEGORY' },
  });
  if (existing) {
    return existing;
  }
  return tx.forecast.create({
    data: {
      ...key,
      subcategoryId: null,
      level: 'CATEGORY',
      sum: new Decimal(0),
      comment: '',
    },
  });
}

const upsertCategoryForecastInputSchema = z.object({
  categoryId: z.number(),
  month: z.number(),
  year: z.number(),
  sum: z.string().optional(),
  comment: z.string().optional(),
});

export type UpsertCategoryForecastInput = z.infer<
  typeof upsertCategoryForecastInputSchema
>;

/**
 * Writes only the category-level row. Rejects a sum write while any
 * subcategory-level row is non-zero (mirrors the client-side lock, enforced
 * here since server functions are callable directly regardless of route) —
 * a locked category's value is derived from its children exclusively via
 * `upsertSubcategoryForecasts`. Returns nothing — the client invalidates the
 * forecasts query to pick up the write.
 */
export const upsertCategoryForecast = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((input: UpsertCategoryForecastInput) =>
    upsertCategoryForecastInputSchema.parse(input),
  )
  .handler(async ({ data, context }) => {
    const key = {
      categoryId: data.categoryId,
      month: data.month,
      year: data.year,
      projectId: context.projectId,
    };

    await prisma.$transaction(async (tx) => {
      const categoryRow = await findOrCreateCategoryRow(tx, key);

      if (data.sum !== undefined) {
        const children = await findChildren(tx, key);
        if (children.some((c) => !c.sum.isZero())) {
          throw new Error(
            `Cannot set category ${data.categoryId} forecast directly while it has non-zero subcategory forecasts`,
          );
        }
      }

      await tx.forecast.update({
        where: { id: categoryRow.id },
        data:
          data.sum !== undefined
            ? { sum: new Decimal(data.sum).abs() }
            : { comment: data.comment },
      });
    });
  });

const upsertSubcategoryForecastsInputSchema = z.object({
  categoryId: z.number(),
  month: z.number(),
  year: z.number(),
  items: z
    .array(
      z.object({
        subcategoryId: z.number().nullable(),
        sum: z.string().optional(),
        comment: z.string().optional(),
      }),
    )
    .min(1),
});

export type UpsertSubcategoryForecastsInput = z.infer<
  typeof upsertSubcategoryForecastsInputSchema
>;

/**
 * Bulk-writes subcategory-level rows for a single category (a named
 * subcategory, or Rest via `subcategoryId: null`), materializes Rest on
 * first touch of any child, and recomputes `category.sum := Σ(children)`
 * once for the whole batch. Returns nothing — the client invalidates the
 * forecasts query to pick up the writes.
 */
export const upsertSubcategoryForecasts = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((input: UpsertSubcategoryForecastsInput) =>
    upsertSubcategoryForecastsInputSchema.parse(input),
  )
  .handler(async ({ data, context }) => {
    const key = {
      categoryId: data.categoryId,
      month: data.month,
      year: data.year,
      projectId: context.projectId,
    };

    await prisma.$transaction(async (tx) => {
      const categoryRow = await findOrCreateCategoryRow(tx, key);
      let children = await findChildren(tx, key);

      if (children.length === 0) {
        const rest = await tx.forecast.create({
          data: {
            ...key,
            subcategoryId: null,
            level: 'SUBCATEGORY',
            sum: categoryRow.sum,
            comment: '',
          },
        });
        children = [rest];
      }

      for (const item of data.items) {
        const existingChild = children.find(
          (c) => c.subcategoryId === item.subcategoryId,
        );
        if (existingChild) {
          await tx.forecast.update({
            where: { id: existingChild.id },
            data:
              item.sum !== undefined
                ? { sum: new Decimal(item.sum).abs() }
                : { comment: item.comment },
          });
        } else {
          await tx.forecast.create({
            data: {
              ...key,
              subcategoryId: item.subcategoryId,
              level: 'SUBCATEGORY',
              sum:
                item.sum !== undefined
                  ? new Decimal(item.sum).abs()
                  : new Decimal(0),
              comment: item.comment ?? '',
            },
          });
        }
      }

      const freshChildren = await findChildren(tx, key);
      const newSum = freshChildren.reduce(
        (s, c) => s.plus(c.sum),
        new Decimal(0),
      );
      await tx.forecast.update({
        where: { id: categoryRow.id },
        data: { sum: newSum },
      });
    });
  });
