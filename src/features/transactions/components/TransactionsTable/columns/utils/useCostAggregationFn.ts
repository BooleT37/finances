import type { Row } from '@tanstack/react-table';
import Decimal from 'decimal.js';
import { useCallback } from 'react';

import type {
  CostColValue,
  TransactionTableItem,
} from '~/features/transactions/components/TransactionsTable/TransactionsTable.types';

export const useCostAggregationFn = () =>
  useCallback(
    (_columnId: string, rows: Row<TransactionTableItem>[]): CostColValue => {
      const value = rows.reduce(
        (a, c) =>
          c.original.isUpcomingSubscription || c.original.isFromSavings
            ? a
            : a.add(c.original.cost?.cost ?? 0),
        new Decimal(0),
      );

      return {
        cost: value,
        isIncome: rows[0].original.isIncome,
        isSubscription: false,
        isUpcomingSubscription: false,
      };
    },
    [],
  );
