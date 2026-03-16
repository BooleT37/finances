import { createFileRoute } from '@tanstack/react-router';

import { TransactionsPage } from '~/features/transactions/components/TransactionsPage/TransactionsPage';

export const Route = createFileRoute('/transactions')({
  component: TransactionsPage,
});
