import { z } from 'zod';

import { datetimeCodec, decimalCodec } from '~/shared/codecs';

export const parsedExpenseSchema = z.object({
  date: datetimeCodec,
  type: z.string(),
  description: z.string(),
  amount: decimalCodec,
  hash: z.string(),
});

export type ParsedExpense = z.output<typeof parsedExpenseSchema>;
