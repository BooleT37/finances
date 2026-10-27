import { z } from 'zod';

import { datetimeCodec } from '~/shared/codecs';

export const BANK_CALLBACK_PATH = '/settings/sources/bank-callback';

export const bankConnectionSchema = z.object({
  sourceId: z.number(),
  expiresAt: datetimeCodec,
  lastImportedAt: datetimeCodec.nullable(),
  hasAccount: z.boolean(),
});

export type BankConnectionWire = z.input<typeof bankConnectionSchema>;
export type BankConnection = z.output<typeof bankConnectionSchema>;

export const bankConnectionSourceSchema = z.object({
  sourceId: z.number(),
});

export const completeBankAuthSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

export const selectBankAccountSchema = z.object({
  sourceId: z.number(),
  accountUid: z.string().min(1),
});

export const bankAccountSchema = z.object({
  uid: z.string(),
  label: z.string(),
});

export type BankConnectionSourceInput = z.infer<
  typeof bankConnectionSourceSchema
>;
export type CompleteBankAuthInput = z.infer<typeof completeBankAuthSchema>;
export type SelectBankAccountInput = z.infer<typeof selectBankAccountSchema>;
export type BankAccount = z.infer<typeof bankAccountSchema>;
