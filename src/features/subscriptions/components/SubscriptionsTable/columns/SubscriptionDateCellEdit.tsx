import { useMolecule } from 'bunshi/react';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useSetAtom } from 'jotai';
import type { MRT_TableInstance } from 'mantine-react-table';
import { useTranslation } from 'react-i18next';

import { EditableDateCell } from '~/shared/components/EditableDateCell';

import type { Subscription } from '../../../schema';
import { SubscriptionInlineEditMolecule } from '../subscriptionInlineEditMolecule';

interface SubscriptionDateCellEditProps {
  value: Dayjs;
  row: Subscription;
  table: MRT_TableInstance<Subscription>;
}

export function SubscriptionDateCellEdit({
  value,
  row,
  table,
}: SubscriptionDateCellEditProps) {
  const { t } = useTranslation('subscriptions');
  const { updateInlineSubscriptionFieldAtom } = useMolecule(
    SubscriptionInlineEditMolecule,
  );
  const updateInlineSubscriptionField = useSetAtom(
    updateInlineSubscriptionFieldAtom,
  );

  return (
    <EditableDateCell
      aria-label={t('columns.firstDate')}
      value={value.toDate()}
      onClose={() => table.setEditingCell(null)}
      onSave={(date) =>
        // The global error notification middleware already surfaces failures.
        updateInlineSubscriptionField(row, {
          field: 'firstDate',
          value: dayjs(date),
        }).catch(() => {})
      }
    />
  );
}
