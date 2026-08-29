import { modals } from '@mantine/modals';
import type Decimal from 'decimal.js';

import type { ForecastLineItem } from '~/features/budgeting/schema';

import { BreakdownModal } from './BreakdownModal';
import type { BreakdownFormRow } from './BreakdownModal.utils';

interface Params {
  title: string;
  lineItems: ForecastLineItem[];
  onSave: (rows: BreakdownFormRow[], total: Decimal) => void;
  onRemove: () => void;
}

export function openBreakdownModal({
  title,
  lineItems,
  onSave,
  onRemove,
}: Params) {
  const modalId = modals.open({
    title,
    size: 'xl',
    children: (
      <BreakdownModal
        lineItems={lineItems}
        onSave={onSave}
        onRemove={onRemove}
        onClose={() => modals.close(modalId)}
      />
    ),
  });
}
