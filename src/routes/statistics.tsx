import { Stack } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';

import { ComparisonChart } from '~/features/statistics/components/ComparisonChart/ComparisonChart';
import { DynamicsChart } from '~/features/statistics/components/DynamicsChart/DynamicsChart';

export const Route = createFileRoute('/statistics')({
  component: StatisticsPage,
});

function StatisticsPage() {
  return (
    <Stack gap="xl">
      <ComparisonChart />
      <DynamicsChart />
    </Stack>
  );
}
