import { createServerFn } from '@tanstack/react-start';
import Decimal from 'decimal.js';
import { z } from 'zod';

import { prisma } from '~/server/db';
import { adaptCost } from '~/shared/utils/adaptCost';

import { forecastSchema } from './schema';

export const fetchForecastsByYear = createServerFn({ method: 'GET' })
  .inputValidator((year: number) => year)
  .handler(async ({ data: year }) => {
    const forecasts = await prisma.forecast.findMany({
      where: { year },
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

// TODO: replace userId with actual user from auth once auth is implemented
export const upsertForecast = createServerFn({ method: 'POST' })
  .inputValidator((input: UpsertForecastInput) =>
    upsertForecastInputSchema.parse(input),
  )
  .handler(async ({ data }) => {
    // TODO: replace with actual user from auth
    const user = await prisma.user.findFirstOrThrow();

    const existing = await prisma.forecast.findFirst({
      where: {
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId,
        month: data.month,
        year: data.year,
        userId: user.id,
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
        userId: user.id,
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
