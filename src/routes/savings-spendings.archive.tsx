import { createFileRoute } from '@tanstack/react-router';

import { SavingSpendingsArchivePage } from '~/features/savingSpendings/components/SavingSpendingsPage/SavingSpendingsArchivePage';

export const Route = createFileRoute('/savings-spendings/archive')({
  component: SavingSpendingsArchivePage,
});
