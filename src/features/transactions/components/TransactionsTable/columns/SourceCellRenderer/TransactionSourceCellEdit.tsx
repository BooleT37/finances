import { useMolecule } from 'bunshi/react';
import { useSetAtom } from 'jotai';
import type { MRT_TableInstance } from 'mantine-react-table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useOrderedSources } from '~/features/sources/facets/orderedSources';
import { EditableSelectCell } from '~/shared/components/EditableSelectCell';

import { TransactionInlineEditMolecule } from '../../transactionInlineEditMolecule';
import type { TransactionTableItem } from '../../TransactionsTable.types';

interface TransactionSourceCellEditProps {
  row: TransactionTableItem;
  table: MRT_TableInstance<TransactionTableItem>;
}

export function TransactionSourceCellEdit({
  row,
  table,
}: TransactionSourceCellEditProps) {
  const { t } = useTranslation('transactions');
  const sources = useOrderedSources();
  const { updateInlineTransactionFieldAtom } = useMolecule(
    TransactionInlineEditMolecule,
  );
  const updateInlineTransactionField = useSetAtom(
    updateInlineTransactionFieldAtom,
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
      value={row.sourceId !== null ? String(row.sourceId) : null}
      onClose={() => table.setEditingCell(null)}
      onSave={(value) =>
        // The global error notification middleware already surfaces failures.
        updateInlineTransactionField(row.id, {
          field: 'sourceId',
          value: value !== null ? Number(value) : null,
        }).catch(() => {})
      }
    />
  );
}
