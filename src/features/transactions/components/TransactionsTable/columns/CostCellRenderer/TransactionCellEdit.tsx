import { useMolecule } from 'bunshi/react';
import Decimal from 'decimal.js';
import { useSetAtom } from 'jotai';
import type { MRT_TableInstance } from 'mantine-react-table';
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

interface TransactionCellEditProps {
  value: CostColValue | null;
  row: TransactionTableItem;
  table: MRT_TableInstance<TransactionTableItem>;
}

export function TransactionCellEdit({
  value: col,
  row,
  table,
}: TransactionCellEditProps) {
  const { t } = useTranslation('transactions');
  const { updateInlineTransactionFieldAtom } = useMolecule(
    TransactionInlineEditMolecule,
  );
  const updateInlineTransactionField = useSetAtom(
    updateInlineTransactionFieldAtom,
  );

  const handleSave = useCallback(
    (value: string) => {
      if (!col) {
        return Promise.resolve(undefined);
      }

      const enteredAbs = new Decimal(value).abs();
      const enteredSigned = adaptCost(enteredAbs, col.isIncome ?? false);
      // The cell shows the tx cost minus its components (see useTransactionTableItems),
      // so editing it means solving back for the total tx cost the API expects.
      const newCost =
        col.costWithComponents !== undefined
          ? enteredSigned.plus(col.costWithComponents.minus(col.cost))
          : enteredSigned;

      // The global error notification middleware already surfaces failures.
      return updateInlineTransactionField(row.id, {
        field: 'cost',
        value: newCost,
      }).catch(() => {});
    },
    [col, row.id, updateInlineTransactionField],
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
