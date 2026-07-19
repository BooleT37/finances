import { Box } from '@mantine/core';
import { useAtom, useAtomValue } from 'jotai';
import { useEffect } from 'react';

import { FeatureOnboardingTour } from '~/features/onboarding/components/FeatureOnboardingTour';
import { getToday } from '~/shared/utils/today';
import {
  selectedMonthKeyAtom,
  selectedYearAtom,
  viewModeAtom,
} from '~/stores/month';

import { useBudgetingOnboardingSteps } from '../../onboarding/useBudgetingOnboardingSteps';
import { BudgetingTable } from './BudgetingTable/BudgetingTable';

export function BudgetingPage() {
  const [viewMode, setViewMode] = useAtom(viewModeAtom);
  const [, setMonth] = useAtom(selectedMonthKeyAtom);
  const year = useAtomValue(selectedYearAtom);
  const steps = useBudgetingOnboardingSteps();

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

  return (
    <FeatureOnboardingTour featureKey="budgeting" steps={steps}>
      <Box data-onboarding-tour-id="budgeting-intro">
        <BudgetingTable />
      </Box>
    </FeatureOnboardingTour>
  );
}
