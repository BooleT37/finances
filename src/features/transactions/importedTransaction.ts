import { z } from 'zod';

import { datetimeCodec, decimalCodec } from '~/shared/codecs';

export const importedTransactionSchema = z.object({
  date: datetimeCodec,
  type: z.string(),
  description: z.string(),
  amount: decimalCodec,
  hash: z.string(),
});

export type ImportedTransaction = z.output<typeof importedTransactionSchema>;
