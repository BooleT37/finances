import { z } from 'zod';

const comparisonPeriodInputSchema = z.object({
  start: z.string(),
  end: z.string(),
});

export const fetchComparisonDataInputSchema = z.object({
  period1: comparisonPeriodInputSchema,
  period2: comparisonPeriodInputSchema,
});

export type FetchComparisonDataInput = z.output<
  typeof fetchComparisonDataInputSchema
>;

export const comparisonCategoryDataSchema = z.object({
  categoryId: z.number(),
  period1: z.number(),
  period2: z.number(),
});

export type ComparisonCategoryData = z.output<
  typeof comparisonCategoryDataSchema
>;

export const fetchDynamicsDataInputSchema = z.object({
  from: z.string(),
  to: z.string(),
  categoryIds: z.array(z.number()),
});

export type FetchDynamicsDataInput = z.output<
  typeof fetchDynamicsDataInputSchema
>;

export const dynamicsMonthDataSchema = z
  .object({ month: z.string() })
  .catchall(z.number());

export type DynamicsMonthData = z.output<typeof dynamicsMonthDataSchema>;
