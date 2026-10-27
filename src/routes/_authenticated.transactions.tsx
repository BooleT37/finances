import { createFileRoute } from '@tanstack/react-router';

import { ImportButton } from '~/features/import/components/ImportButton';
import { TransactionsPage } from '~/features/transactions/components/TransactionsPage/TransactionsPage';

export const Route = createFileRoute('/_authenticated/transactions')({
  component: () => <TransactionsPage importAction={<ImportButton />} />,
});
