import Decimal from 'decimal.js';
import type { MRT_Row } from 'mantine-react-table';
import { useCallback } from 'react';

import type { BudgetingRow } from './BudgetingTable.types';
import { useBulkSaveForecastsSum } from './useBulkSaveForecastsSum';

export function useSaveForecastSum(month: number, year: number) {
  const bulkSave = useBulkSaveForecastsSum(month, year);

  return useCallback(
    (row: MRT_Row<BudgetingRow>, enteredAbs: number) => {
      bulkSave([{ row, enteredAbs: new Decimal(enteredAbs) }]);
    },
    [bulkSave],
  );
}
