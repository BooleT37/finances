import { useMolecule } from 'bunshi/react';
import { useSetAtom } from 'jotai';
import type { MRT_TableInstance } from 'mantine-react-table-open';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useOrderedSources } from '~/features/sources/facets/orderedSources';
import { EditableSelectCell } from '~/shared/components/EditableSelectCell';

import type { Subscription } from '../../../schema';
import { SubscriptionInlineEditMolecule } from '../subscriptionInlineEditMolecule';

interface SubscriptionSourceCellEditProps {
  value: Subscription['sourceId'];
  row: Subscription;
  table: MRT_TableInstance<Subscription>;
}

export function SubscriptionSourceCellEdit({
  value,
  row,
  table,
}: SubscriptionSourceCellEditProps) {
  const { t } = useTranslation('subscriptions');
  const sources = useOrderedSources();
  const { updateInlineSubscriptionFieldAtom } = useMolecule(
    SubscriptionInlineEditMolecule,
  );
  const updateInlineSubscriptionField = useSetAtom(
    updateInlineSubscriptionFieldAtom,
  );

  const data = useMemo(
    () => (sources ?? []).map((s) => ({ value: String(s.id), label: s.name })),
    [sources],
  );

  return (
    <EditableSelectCell
      aria-label={t('columns.source')}
      searchable
      clearable
      data={data}
      value={value !== null ? String(value) : null}
      onClose={() => table.setEditingCell(null)}
      onSave={(value) =>
        // The global error notification middleware already surfaces failures.
        updateInlineSubscriptionField(row, {
          field: 'sourceId',
          value: value !== null ? Number(value) : null,
        }).catch(() => {})
      }
    />
  );
}
