import { createFileRoute } from '@tanstack/react-router';

import { SavingSpendingsArchivePage } from '~/features/savingSpendings/components/SavingSpendingsPage/SavingSpendingsArchivePage';

export const Route = createFileRoute(
  '/_authenticated/savings-spendings/archive',
)({
  component: SavingSpendingsArchivePage,
});
