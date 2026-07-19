import { Box, Stack } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';

import { FeatureOnboardingTour } from '~/features/onboarding/components/FeatureOnboardingTour';
import { ComparisonChart } from '~/features/statistics/components/ComparisonChart/ComparisonChart';
import { DynamicsChart } from '~/features/statistics/components/DynamicsChart/DynamicsChart';
import { useStatisticsOnboardingSteps } from '~/features/statistics/onboarding/useStatisticsOnboardingSteps';

export const Route = createFileRoute('/_authenticated/statistics')({
  component: StatisticsPage,
});

function StatisticsPage() {
  const steps = useStatisticsOnboardingSteps();

  return (
    <FeatureOnboardingTour featureKey="statistics" steps={steps}>
      <Box data-onboarding-tour-id="statistics-intro">
        <Stack gap="xl">
          <ComparisonChart />
          <DynamicsChart />
        </Stack>
      </Box>
    </FeatureOnboardingTour>
  );
}
