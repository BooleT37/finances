import { Text } from '@mantine/core';
import { useAtom, useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { getToday } from '~/shared/utils/today';
import {
  selectedMonthAtom,
  selectedYearAtom,
  viewModeAtom,
} from '~/stores/month';

export function BudgetingPage() {
  const { t } = useTranslation('budgeting');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Text c="dimmed">{t('grandTotal')}</Text>;
}
