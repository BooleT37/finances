import { Bank } from '~/generated/prisma/enums';

const BANKS_WITH_STATEMENT_PARSER: ReadonlySet<Bank> = new Set([Bank.VIVID]);

export const bankHasStatementParser = (bank: Bank | null) =>
  bank !== null && BANKS_WITH_STATEMENT_PARSER.has(bank);
