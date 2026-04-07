import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { useMemo } from 'react';

import { getToday } from '~/shared/utils/today';
import { selectedMonthKeyAtom } from '~/stores/month';

import type { TransactionFormValues } from './transactionFormValues';

export function useEmptyTransactionFormValues(): TransactionFormValues {
  const selectedMonth = useAtomValue(selectedMonthKeyAtom);

  return useMemo(
    (): TransactionFormValues => ({
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
    }),
    [selectedMonth],
  );
}
