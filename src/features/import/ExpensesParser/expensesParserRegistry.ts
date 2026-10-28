import type { Bank } from '~/generated/prisma/enums';

import type { IExpensesParser } from './ExpensesParser';

const parsers: Partial<
  Record<Bank, (filePath: string) => Promise<IExpensesParser>>
> = {
  VIVID: async (filePath) => {
    const { VividPdfExpensesParser } = await import('./VividPdfExpensesParser');
    return new VividPdfExpensesParser(filePath);
  },
};

export async function createExpensesParser(
  bank: Bank | null,
  filePath: string,
): Promise<IExpensesParser> {
  const createParser = bank === null ? undefined : parsers[bank];
  if (!createParser) {
    throw new Error('This source has no statement parser');
  }
  return createParser(filePath);
}
