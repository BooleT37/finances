import { useAtom, useAtomValue } from 'jotai';
import { useEffect } from 'react';

import { getToday } from '~/shared/utils/today';
import {
  selectedMonthAtom,
  selectedMonthNumberAtom,
  selectedYearAtom,
  viewModeAtom,
} from '~/stores/month';

import { BudgetingTable } from './BudgetingTable';
import { useBudgetingRows } from './useBudgetingRows';

export function BudgetingPage() {
  const [viewMode, setViewMode] = useAtom(viewModeAtom);
  const [, setMonth] = useAtom(selectedMonthAtom);
  const year = useAtomValue(selectedYearAtom);
  const month = useAtomValue(selectedMonthNumberAtom);

  useEffect(() => {
    if (viewMode === 'year') {
      setViewMode('month');
      const currentYear = getToday().year();
      if (year === currentYear) {
        setMonth(getToday().format('YYYY-MM'));
      } else {
        setMonth(`${year}-01`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { rows, isLoading } = useBudgetingRows(month, year);

  return <BudgetingTable rows={rows} isLoading={isLoading} />;
}
