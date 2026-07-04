import { useMolecule } from 'bunshi/react';
import dayjs from 'dayjs';
import { useSetAtom } from 'jotai';
import type { MRT_TableInstance } from 'mantine-react-table';
import { useTranslation } from 'react-i18next';

import { EditableDateCell } from '~/shared/components/EditableDateCell';
import { DATE_FORMAT } from '~/shared/constants';

import { TransactionInlineEditMolecule } from '../../transactionInlineEditMolecule';
import type { TransactionTableItem } from '../../TransactionsTable.types';

interface TransactionDateCellEditProps {
  value: TransactionTableItem['date'];
  row: TransactionTableItem;
  table: MRT_TableInstance<TransactionTableItem>;
}

export function TransactionDateCellEdit({
  value,
  row,
  table,
}: TransactionDateCellEditProps) {
  const { t } = useTranslation('transactions');
  const { updateInlineTransactionFieldAtom } = useMolecule(
    TransactionInlineEditMolecule,
  );
  const updateInlineTransactionField = useSetAtom(
    updateInlineTransactionFieldAtom,
  );

  return (
    <EditableDateCell
      aria-label={t('columns.date')}
      value={dayjs(value, DATE_FORMAT).toDate()}
      onClose={() => table.setEditingCell(null)}
      onSave={(date) =>
        // The global error notification middleware already surfaces failures.
        updateInlineTransactionField(row.id, {
          field: 'date',
          value: dayjs(date),
        }).catch(() => {})
      }
    />
  );
}
