import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import { bankImportStartDate } from './bankImportStartDate';

describe('bankImportStartDate', () => {
  it('starts at the beginning of the month on a first import', () => {
    expect(
      bankImportStartDate({
        lastImportedAt: null,
        lastImportedTransactionDate: dayjs('2024-02-20'),
      }),
    ).toBe('2024-04-01');
  });

  it('starts before the newest imported transaction when the rows after it were left unticked', () => {
    expect(
      bankImportStartDate({
        lastImportedAt: dayjs('2024-04-05'),
        lastImportedTransactionDate: dayjs('2024-03-31'),
      }),
    ).toBe('2024-03-29');
  });

  it('starts before the import day when a future-dated transaction was imported', () => {
    expect(
      bankImportStartDate({
        lastImportedAt: dayjs('2024-03-31'),
        lastImportedTransactionDate: dayjs('2024-04-02'),
      }),
    ).toBe('2024-03-29');
  });

  it('starts before the import day when no imported transactions are left', () => {
    expect(
      bankImportStartDate({
        lastImportedAt: dayjs('2024-04-05'),
        lastImportedTransactionDate: null,
      }),
    ).toBe('2024-04-03');
  });
});
