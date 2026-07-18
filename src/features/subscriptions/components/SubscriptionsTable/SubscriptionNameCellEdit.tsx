import { useMolecule } from 'bunshi/react';
import { useSetAtom } from 'jotai';
import type { MRT_TableInstance } from 'mantine-react-table-open';
import { useTranslation } from 'react-i18next';

import { EditableCellInput } from '~/shared/components/EditableCellInput';

import type { Subscription } from '../../schema';
import { SubscriptionInlineEditMolecule } from './subscriptionInlineEditMolecule';

interface SubscriptionNameCellEditProps {
  row: Subscription;
  table: MRT_TableInstance<Subscription>;
}

export function SubscriptionNameCellEdit({
  row,
  table,
}: SubscriptionNameCellEditProps) {
  const { t } = useTranslation('subscriptions');
  const { updateInlineSubscriptionFieldAtom } = useMolecule(
    SubscriptionInlineEditMolecule,
  );
  const updateInlineSubscriptionField = useSetAtom(
    updateInlineSubscriptionFieldAtom,
  );

  return (
    <EditableCellInput
      aria-label={t('columns.name')}
      initialValue={row.name}
      onClose={() => table.setEditingCell(null)}
      onSave={(value) =>
        // The global error notification middleware already surfaces failures.
        updateInlineSubscriptionField(row, {
          field: 'name',
          value,
        }).catch(() => {})
      }
    />
  );
}
