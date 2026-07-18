import { useMolecule } from 'bunshi/react';
import { useSetAtom } from 'jotai';
import type { MRT_TableInstance } from 'mantine-react-table-open';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { EditableCellInput } from '~/shared/components/EditableCellInput';

import { TransactionInlineEditMolecule } from '../../transactionInlineEditMolecule';
import type { TransactionTableItem } from '../../TransactionsTable.types';

interface TransactionNameCellEditProps {
  row: TransactionTableItem;
  table: MRT_TableInstance<TransactionTableItem>;
}

export function TransactionNameCellEdit({
  row,
  table,
}: TransactionNameCellEditProps) {
  const { t } = useTranslation('transactions');
  const { updateInlineTransactionFieldAtom } = useMolecule(
    TransactionInlineEditMolecule,
  );
  const updateInlineTransactionField = useSetAtom(
    updateInlineTransactionFieldAtom,
  );

  const handleSave = useCallback(
    (value: string) => {
      // The global error notification middleware already surfaces failures.
      return updateInlineTransactionField(row.id, {
        field: 'name',
        value,
      }).catch(() => {});
    },
    [row.id, updateInlineTransactionField],
  );

  return (
    <EditableCellInput
      aria-label={t('columns.name')}
      initialValue={row.rawName}
      onClose={() => table.setEditingCell(null)}
      onSave={handleSave}
    />
  );
}
