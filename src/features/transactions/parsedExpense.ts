import type { Dayjs } from 'dayjs';
import type Decimal from 'decimal.js';

export interface ParsedExpenseFromApi {
  date: string;
  type: string;
  description: string;
  amount: string;
  hash: string;
}

export interface ParsedExpense {
  date: Dayjs;
  type: string;
  description: string;
  amount: Decimal;
  hash: string;
}
