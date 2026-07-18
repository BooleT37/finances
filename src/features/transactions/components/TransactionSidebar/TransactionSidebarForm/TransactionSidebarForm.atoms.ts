import dayjs from 'dayjs';
import { atom } from 'jotai';

import { ISO_DATE_FORMAT } from '~/shared/constants';
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
        ? getToday().format(ISO_DATE_FORMAT)
        : dayjs(selectedMonth).startOf('month').format(ISO_DATE_FORMAT),
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
