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
      include: {
        category: true,
        lineItems: { orderBy: { id: 'asc' } },
      },
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
    include: { lineItems: { select: { id: true } } },
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

function isPositiveDecimal(value: string) {
  try {
    return new Decimal(value).gt(0);
  } catch {
    return false;
  }
}

const lineItemInputSchema = z.object({
  unitPrice: z.string().min(1),
  quantity: z.string().refine(isPositiveDecimal),
  comment: z.string(),
  subscriptionId: z.number().nullable(),
});

type LineItemInput = z.infer<typeof lineItemInputSchema>;

/** An empty `items` removes the breakdown, leaving the row's `sum` alone. */
async function replaceLineItems(
  tx: Prisma.TransactionClient,
  forecastId: number,
  projectId: string,
  items: LineItemInput[],
) {
  await tx.forecastLineItem.deleteMany({ where: { forecastId, projectId } });
  if (items.length === 0) {
    return;
  }
  await tx.forecastLineItem.createMany({
    data: items.map((item) => ({
      forecastId,
      projectId,
      unitPrice: item.unitPrice,
      quantity: new Decimal(item.quantity),
      comment: item.comment,
      subscriptionId: item.subscriptionId,
    })),
  });
}

/**
 * Rest holding the remainder is the normal state and has never locked the
 * category, so only a value on a real subcategory counts — but a breakdown
 * counts wherever it sits, Rest included.
 */
function isAuthoritativeChild(child: {
  subcategoryId: number | null;
  sum: Decimal;
  lineItems: { id: number }[];
}) {
  return (
    child.lineItems.length > 0 ||
    (child.subcategoryId !== null && !child.sum.isZero())
  );
}

const upsertCategoryForecastInputSchema = z.object({
  categoryId: z.number(),
  month: z.number(),
  year: z.number(),
  sum: z.string().optional(),
  comment: z.string().optional(),
  lineItems: z.array(lineItemInputSchema).optional(),
});

export type UpsertCategoryForecastInput = z.infer<
  typeof upsertCategoryForecastInputSchema
>;

/**
 * The client greys the cell out while a child owns the total, but server
 * functions are callable directly regardless of route, so the rule is
 * enforced here too. Rest absorbs a sum write to keep the category equal to
 * the sum of its children.
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

      if (data.sum === undefined) {
        if (data.lineItems !== undefined) {
          await replaceLineItems(
            tx,
            categoryRow.id,
            key.projectId,
            data.lineItems,
          );
        }
        await tx.forecast.update({
          where: { id: categoryRow.id },
          data: { comment: data.comment },
        });
        return;
      }

      const children = await findChildren(tx, key);
      if (children.some(isAuthoritativeChild)) {
        throw new Error(
          `Cannot set category ${data.categoryId} forecast directly while a subcategory owns its total`,
        );
      }

      if (data.lineItems !== undefined) {
        await replaceLineItems(
          tx,
          categoryRow.id,
          key.projectId,
          data.lineItems,
        );
      }

      const newSum = new Decimal(data.sum).abs();
      await tx.forecast.update({
        where: { id: categoryRow.id },
        data: { sum: newSum },
      });

      const rest = children.find((c) => c.subcategoryId === null);
      if (rest) {
        const realSum = children
          .filter((c) => c.subcategoryId !== null)
          .reduce((s, c) => s.plus(c.sum), new Decimal(0));
        await tx.forecast.update({
          where: { id: rest.id },
          data: { sum: newSum.minus(realSum) },
        });
      }
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
        lineItems: z.array(lineItemInputSchema).optional(),
      }),
    )
    .min(1),
});

export type UpsertSubcategoryForecastsInput = z.infer<
  typeof upsertSubcategoryForecastsInputSchema
>;

/**
 * Rest is created the first time any child is touched, and writing a
 * breakdown counts as touching one. The category's sum is recomputed once for
 * the whole batch rather than per item.
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
        children = [{ ...rest, lineItems: [] }];
      }

      for (const item of data.items) {
        const existingChild = children.find(
          (c) => c.subcategoryId === item.subcategoryId,
        );
        const row =
          existingChild ??
          (await tx.forecast.create({
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
          }));

        if (existingChild) {
          await tx.forecast.update({
            where: { id: existingChild.id },
            data:
              item.sum !== undefined
                ? { sum: new Decimal(item.sum).abs() }
                : { comment: item.comment },
          });
        }

        if (item.lineItems !== undefined) {
          await replaceLineItems(tx, row.id, key.projectId, item.lineItems);
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
