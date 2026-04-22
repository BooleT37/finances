import type { MRT_Row, MRT_TableInstance } from 'mantine-react-table';

import { useUpdateCategoryOrder } from '~/features/categories/queries';
import type { Category } from '~/features/categories/schema';
import { moveItem } from '~/shared/utils/moveItem';

function getCategoriesOrder(
  table: MRT_TableInstance<Category>,
  isIncome: boolean,
): number[] {
  return table
    .getSortedRowModel()
    .flatRows.filter(
      (row) => !row.getIsGrouped() && row.original.isIncome === isIncome,
    )
    .map((row) => row.original.id);
}

export const usePersistCategoriesOrder = () => {
  const updateCategoryOrder = useUpdateCategoryOrder();
  return (table: MRT_TableInstance<Category>, isIncome: boolean) => {
    const { draggingRow, hoveredRow } = table.getState();
    if (!draggingRow || !hoveredRow || !('original' in hoveredRow)) {
      return;
    }
    const categoryIds = moveItem(
      getCategoriesOrder(table, isIncome),
      (draggingRow as MRT_Row<Category>).original.id,
      (hoveredRow as MRT_Row<Category>).original.id,
    );
    updateCategoryOrder.mutate({ isIncome, categoryIds });
  };
};
