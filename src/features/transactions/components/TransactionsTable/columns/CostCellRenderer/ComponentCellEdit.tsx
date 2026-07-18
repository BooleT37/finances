import { useMolecule } from 'bunshi/react';
import Decimal from 'decimal.js';
import { useSetAtom } from 'jotai';
import type { MRT_TableInstance } from 'mantine-react-table-open';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { EditableCellInput } from '~/shared/components/EditableCellInput';
import { adaptCost } from '~/shared/utils/adaptCost';
import { costRegex } from '~/shared/utils/table/validation';

import { TransactionInlineEditMolecule } from '../../transactionInlineEditMolecule';
import type {
  CostColValue,
  TransactionTableItem,
} from '../../TransactionsTable.types';

interface ComponentCellEditProps {
  value: CostColValue | null;
  row: TransactionTableItem;
  table: MRT_TableInstance<TransactionTableItem>;
}

export function ComponentCellEdit({
  value: col,
  row,
  table,
}: ComponentCellEditProps) {
  const { t } = useTranslation('transactions');
  const { updateInlineComponentFieldAtom } = useMolecule(
    TransactionInlineEditMolecule,
  );
  const updateInlineComponentField = useSetAtom(updateInlineComponentFieldAtom);

  const handleSave = useCallback(
    (value: string) => {
      if (!col) {
        return Promise.resolve(undefined);
      }

      const enteredAbs = new Decimal(value).abs();
      const newCost = adaptCost(enteredAbs, col.isIncome ?? false);

      // The global error notification middleware already surfaces failures.
      return updateInlineComponentField(row.expenseId!, row.id, {
        field: 'cost',
        value: newCost,
      }).catch(() => {});
    },
    [col, row.expenseId, row.id, updateInlineComponentField],
  );

  if (!col) {
    return null;
  }

  return (
    <EditableCellInput
      aria-label={t('columns.cost')}
      initialValue={col.cost.abs().toFixed(2)}
      isValid={(value) => costRegex.test(value)}
      onClose={() => table.setEditingCell(null)}
      onSave={handleSave}
    />
  );
}
