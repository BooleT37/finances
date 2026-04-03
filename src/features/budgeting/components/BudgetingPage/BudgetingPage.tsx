import { useAtom, useAtomValue } from 'jotai';
import { useEffect } from 'react';

import { getToday } from '~/shared/utils/today';
import {
  selectedMonthAtom,
  selectedYearAtom,
  viewModeAtom,
} from '~/stores/month';

import { BudgetingTable } from './BudgetingTable';

export function BudgetingPage() {
  const [viewMode, setViewMode] = useAtom(viewModeAtom);
  const [, setMonth] = useAtom(selectedMonthAtom);
  const year = useAtomValue(selectedYearAtom);

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
  }, [setMonth, setViewMode, viewMode, year]);

  return <BudgetingTable />;
}
