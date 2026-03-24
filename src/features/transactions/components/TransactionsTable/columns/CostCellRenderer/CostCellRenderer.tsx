import { costToString } from '~/shared/utils/costToString';

import type { CostColValue } from '../../TransactionsTable.types';
import { CostCellView } from './CostCellView';

interface CostCellRendererProps {
  value: CostColValue | null;
}

export function CostCellRenderer({ value: col }: CostCellRendererProps) {
  if (!col) {
    return null;
  }

  return (
    <CostCellView
      cost={costToString(col.cost)}
      isSubscription={col.isSubscription}
      isUpcomingSubscription={col.isUpcomingSubscription}
      parentExpenseName={col.parentExpenseName}
      costWithComponents={col.costWithComponents}
    />
  );
}
