import { createServerFn } from '@tanstack/react-start';
import Decimal from 'decimal.js';
import { z } from 'zod';

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

const upsertForecastInputSchema = z.object({
  categoryId: z.number(),
  subcategoryId: z.number().nullable(),
  month: z.number(),
  year: z.number(),
  sum: z.string().optional(),
  comment: z.string().optional(),
});

export type UpsertForecastInput = z.infer<typeof upsertForecastInputSchema>;

const upsertBulkForecastsInputSchema = z.array(upsertForecastInputSchema);
export type UpsertBulkForecastsInput = z.infer<
  typeof upsertBulkForecastsInputSchema
>;

export const upsertBulkForecasts = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((input: UpsertBulkForecastsInput) =>
    upsertBulkForecastsInputSchema.parse(input),
  )
  .handler(async ({ data, context }) => {
    const results = await prisma.$transaction(async (tx) => {
      const output = [];
      for (const item of data) {
        const existing = await tx.forecast.findFirst({
          where: {
            categoryId: item.categoryId,
            subcategoryId: item.subcategoryId,
            month: item.month,
            year: item.year,
            projectId: context.projectId,
          },
        });

        let result;
        if (existing) {
          result = await tx.forecast.update({
            where: { id: existing.id },
            data:
              item.sum !== undefined
                ? { sum: new Decimal(item.sum).abs() }
                : { comment: item.comment },
            include: { category: true },
          });
        } else {
          result = await tx.forecast.create({
            data: {
              categoryId: item.categoryId,
              subcategoryId: item.subcategoryId,
              month: item.month,
              year: item.year,
              projectId: context.projectId,
              sum:
                item.sum !== undefined
                  ? new Decimal(item.sum).abs()
                  : new Decimal(0),
              comment: item.comment ?? '',
            },
            include: { category: true },
          });
        }
        output.push(result);
      }
      return output;
    });

    return results.map((result) =>
      forecastSchema.encode({
        ...result,
        sum: adaptCost(result.sum, result.category.isIncome),
      }),
    );
  });

export const upsertForecast = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((input: UpsertForecastInput) =>
    upsertForecastInputSchema.parse(input),
  )
  .handler(async ({ data, context }) => {
    const existing = await prisma.forecast.findFirst({
      where: {
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId,
        month: data.month,
        year: data.year,
        projectId: context.projectId,
      },
    });

    if (existing) {
      const result = await prisma.forecast.update({
        where: { id: existing.id },
        data:
          data.sum !== undefined
            ? { sum: new Decimal(data.sum).abs() }
            : { comment: data.comment },
        include: { category: true },
      });

      return forecastSchema.encode({
        ...result,
        sum: adaptCost(result.sum, result.category.isIncome),
      });
    }
    const result = await prisma.forecast.create({
      data: {
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId,
        month: data.month,
        year: data.year,
        projectId: context.projectId,
        sum:
          data.sum !== undefined ? new Decimal(data.sum).abs() : new Decimal(0),
        comment: data.comment ?? '',
      },
      include: { category: true },
    });

    return forecastSchema.encode({
      ...result,
      sum: adaptCost(result.sum, result.category.isIncome),
    });
  });
