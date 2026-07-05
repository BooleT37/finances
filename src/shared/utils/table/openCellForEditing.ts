import type {
  MRT_Cell,
  MRT_RowData,
  MRT_TableInstance,
} from 'mantine-react-table';

/**
 * MRT's built-in default edit input (used when a column has no custom `Edit`
 * render prop) is only ever focused by MRT's own onDoubleClick handler, which
 * calls `.focus()`/`.select()` on the input a tick after opening it. Since we
 * open cells for editing on a single click ourselves (via setEditingCell),
 * we have to replicate that focus step here too.
 */
export function openCellForEditing<TData extends MRT_RowData>(
  table: MRT_TableInstance<TData>,
  cell: MRT_Cell<TData, unknown>,
) {
  table.setEditingCell(cell);
  setTimeout(() => {
    const input = table.refs.editInputRefs.current[cell.id];
    input?.focus();
    input?.select?.();
  }, 100);
}
