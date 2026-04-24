import type { MRT_Row, MRT_TableInstance } from 'mantine-react-table';

import { useUpdateSourceOrder } from '~/features/sources/queries';
import type { Source } from '~/features/sources/schema';
import { moveItem } from '~/shared/utils/moveItem';

function getSourcesOrder(table: MRT_TableInstance<Source>): number[] {
  return table.getSortedRowModel().flatRows.map((row) => row.original.id);
}

export const usePersistSourcesOrder = () => {
  const updateSourceOrder = useUpdateSourceOrder();
  return (table: MRT_TableInstance<Source>) => {
    const { draggingRow, hoveredRow } = table.getState();
    if (!draggingRow || !hoveredRow || !('original' in hoveredRow)) {
      return;
    }
    const sourceIds = moveItem(
      getSourcesOrder(table),
      (draggingRow as MRT_Row<Source>).original.id,
      (hoveredRow as MRT_Row<Source>).original.id,
    );
    updateSourceOrder.mutate({ sourceIds });
  };
};
