import type {
  MRT_Cell,
  MRT_ColumnDef,
  MRT_Row,
  MRT_RowData,
  MRT_TableInstance,
} from 'mantine-react-table-open';
import type { ReactNode } from 'react';

interface ExpandRowEditableRenderProps<TData extends MRT_RowData> {
  row: MRT_Row<TData>;
  cell: MRT_Cell<TData, unknown>;
  table: MRT_TableInstance<TData>;
}

interface ExpandRowEditablePropsOptions<TData extends MRT_RowData> {
  enableEditing: (row: MRT_Row<TData>) => boolean;
  className?: string;
  Cell: (props: ExpandRowEditableRenderProps<TData>) => ReactNode;
  Edit: (props: ExpandRowEditableRenderProps<TData>) => ReactNode;
}

/**
 * MRT's own Edit machinery (enableEditing/Edit) only applies to regular data
 * columns, not display columns like `mrt-row-expand`. This replicates the
 * click-to-edit toggle by hand for a display column: reading editingCell
 * state directly and reusing the same setEditingCell(cell) pattern as other
 * columns, so it can be spread onto a `displayColumnDefOptions` entry.
 */
export function expandRowEditableProps<TData extends MRT_RowData>({
  enableEditing,
  className,
  Cell,
  Edit,
}: ExpandRowEditablePropsOptions<TData>): Pick<
  MRT_ColumnDef<TData>,
  'enableEditing' | 'mantineTableBodyCellProps' | 'Cell'
> {
  return {
    enableEditing,
    mantineTableBodyCellProps: ({ row, cell, table }) => {
      const isEditable = enableEditing(row);
      return {
        className: isEditable ? className : undefined,
        onClick: () => {
          if (isEditable) {
            table.setEditingCell(cell);
          }
        },
      };
    },
    Cell: (props) => {
      const isEditingThisCell =
        props.table.getState().editingCell?.id === props.cell.id;
      return isEditingThisCell ? Edit(props) : Cell(props);
    },
  };
}
