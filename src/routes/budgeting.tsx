import { createFileRoute } from '@tanstack/react-router';

import { BudgetingPage } from '~/features/budgeting/components/BudgetingPage/BudgetingPage';

export const Route = createFileRoute('/budgeting')({
  component: BudgetingPage,
});
