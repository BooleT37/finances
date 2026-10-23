import dayjs from 'dayjs';
import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import type { ParsedExpense } from '~/features/transactions/parsedExpense';

import { buildCategoryJevCriteria } from './categoryJevCriteria';
import {
  buildCategoryJevQuestion,
  UNKNOWN_JEV_CHOICE,
} from './categoryJevQuestion';
import { categoryRow, expenseRow } from './categorySuggestionsTestData';

const groceries = categoryRow(2, 'Продукты');
const salary = categoryRow(3, 'Зарплата', [], true);
const criteria = buildCategoryJevCriteria({
  categories: [groceries, salary],
  subscriptions: [],
  isIncome: false,
});

const parsedExpense: ParsedExpense = {
  date: dayjs('2026-09-30'),
  type: 'Card transaction',
  description: 'REWE Markt GmbH-Zw, Berlin, DE Card *6213',
  amount: new Decimal('-41.2'),
  hash: 'hash',
};

describe('buildCategoryJevQuestion', () => {
  it('sends the parsed expense with a two-decimal amount and an ISO date', () => {
    const { state } = buildCategoryJevQuestion(parsedExpense, criteria, [], []);

    expect(state.transaction).toEqual({
      description: 'REWE Markt GmbH-Zw, Berlin, DE Card *6213',
      amount: '-41.20',
      date: '2026-09-30',
    });
  });

  it('shows each similar transaction with its signed amount and the criterion it is filed under', () => {
    const similar = expenseRow({
      id: 1,
      importedDescription: 'REWE Markt GmbH-Zw, Berlin, DE Card *3628',
      cost: 23.1,
      date: '2026-09-10',
      category: groceries,
    });

    const { state } = buildCategoryJevQuestion(
      parsedExpense,
      criteria,
      [similar],
      [],
    );

    expect(state.similar_past_transactions).toEqual([
      {
        description: 'REWE Markt GmbH-Zw, Berlin, DE Card *3628',
        amount: '-23.10',
        date: '2026-09-10',
        filed_under: 'Продукты',
      },
    ]);
  });

  it('leaves out a similar transaction that resolves to none of the criteria', () => {
    const income = expenseRow({
      id: 2,
      importedDescription: 'From REWE Markt GmbH',
      cost: 5,
      date: '2026-09-11',
      category: salary,
    });

    const { state } = buildCategoryJevQuestion(
      parsedExpense,
      criteria,
      [income],
      [],
    );

    expect(state.similar_past_transactions).toEqual([]);
  });

  it('offers the criteria plus an unknown choice', () => {
    const { question } = buildCategoryJevQuestion(
      parsedExpense,
      criteria,
      [],
      [],
    );

    expect(question.criteria).toEqual({
      [UNKNOWN_JEV_CHOICE]:
        'None of the other options fits, or the description is not enough to tell.',
      '2': 'Продукты',
    });
  });
});
