import { costToString } from '~/shared/utils/costToString';

import type { CostCol } from '../../../transactionTableItem';
import { CostCellView } from './CostCellView';

interface CostCellRendererProps {
  value: CostCol | null;
}

export function CostCellRenderer({ value: col }: CostCellRendererProps) {
  if (!col) {
    return null;
  }

  return (
    <CostCellView
      cost={costToString(col.value)}
      isSubscription={col.isSubscription}
      isUpcomingSubscription={col.isUpcomingSubscription}
      parentExpenseName={col.parentExpenseName}
      costWithComponents={col.costWithComponents}
    />
  );
}
