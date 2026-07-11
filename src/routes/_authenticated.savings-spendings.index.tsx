import { createFileRoute } from '@tanstack/react-router';

import { SavingSpendingsPage } from '~/features/savingSpendings/components/SavingSpendingsPage/SavingSpendingsPage';

export const Route = createFileRoute('/_authenticated/savings-spendings/')({
  component: SavingSpendingsPage,
});
