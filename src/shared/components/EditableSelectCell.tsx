import { Select } from '@mantine/core';
import { useState } from 'react';

interface EditableSelectCellOption {
  value: string;
  label: string;
}

interface EditableSelectCellProps {
  'aria-label'?: string;
  value: string | null;
  data: EditableSelectCellOption[];
  searchable?: boolean;
  clearable?: boolean;
  onClose: () => void;
  onSave: (value: string | null) => Promise<unknown>;
}

export function EditableSelectCell({
  'aria-label': ariaLabel,
  value,
  data,
  searchable,
  clearable,
  onClose,
  onSave,
}: EditableSelectCellProps) {
  const [opened, setOpened] = useState(true);

  const close = () => {
    setOpened(false);
    onClose();
  };

  return (
    // Combobox options render in a portal, but React's synthetic events still
    // bubble through the component tree, not the DOM tree — without this, an
    // option click would also re-trigger the cell's own onClick (which enters
    // edit mode), undoing the close() below on the same click.
    <div onClick={(e) => e.stopPropagation()}>
      <Select
        size="xs"
        aria-label={ariaLabel}
        searchable={searchable}
        clearable={clearable}
        data={data}
        value={value}
        dropdownOpened={opened}
        onDropdownClose={close}
        onChange={(next) => {
          if (next !== value) {
            void onSave(next);
          }
          close();
        }}
      />
    </div>
  );
}
