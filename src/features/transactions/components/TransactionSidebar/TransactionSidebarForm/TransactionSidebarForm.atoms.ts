import dayjs from 'dayjs';
import { atom } from 'jotai';

import { getToday } from '~/shared/utils/today';
import { selectedMonthKeyAtom } from '~/stores/month';

import type { TransactionFormValues } from './transactionFormValues';

export const emptyTransactionFormValuesAtom = atom(
  (get): TransactionFormValues => {
    const selectedMonth = get(selectedMonthKeyAtom);
    return {
      components: [],
      cost: '',
      name: '',
      date: dayjs(selectedMonth).isSame(getToday(), 'month')
        ? getToday().toDate()
        : dayjs(selectedMonth).startOf('month').toDate(),
      actualDate: null,
      incomeCategory: null,
      incomeSubcategory: null,
      expenseCategory: null,
      expenseSubcategory: null,
      source: null,
      subscription: null,
      savingSpendingCategoryId: null,
      savingSpendingId: null,
      transactionType: 'expense',
    };
  },
);
