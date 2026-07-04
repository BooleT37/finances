import { useMolecule } from 'bunshi/react';
import { useSetAtom } from 'jotai';
import type { MRT_TableInstance } from 'mantine-react-table';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { EditableCellInput } from '~/shared/components/EditableCellInput';

import { TransactionInlineEditMolecule } from '../../transactionInlineEditMolecule';
import type { TransactionTableItem } from '../../TransactionsTable.types';

interface ComponentNameCellEditProps {
  row: TransactionTableItem;
  table: MRT_TableInstance<TransactionTableItem>;
}

export function ComponentNameCellEdit({
  row,
  table,
}: ComponentNameCellEditProps) {
  const { t } = useTranslation('transactions');
  const { updateInlineComponentFieldAtom } = useMolecule(
    TransactionInlineEditMolecule,
  );
  const updateInlineComponentField = useSetAtom(updateInlineComponentFieldAtom);

  const handleSave = useCallback(
    (value: string) => {
      // The global error notification middleware already surfaces failures.
      return updateInlineComponentField(row.expenseId!, row.id, {
        field: 'name',
        value,
      }).catch(() => {});
    },
    [row.expenseId, row.id, updateInlineComponentField],
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
