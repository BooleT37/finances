import { DatePickerInput } from '@mantine/dates';
import { useState } from 'react';

interface EditableDateCellProps {
  'aria-label'?: string;
  value: string;
  onClose: () => void;
  onSave: (value: string) => Promise<unknown>;
}

export function EditableDateCell({
  'aria-label': ariaLabel,
  value,
  onClose,
  onSave,
}: EditableDateCellProps) {
  const [opened, setOpened] = useState(true);

  const close = () => {
    setOpened(false);
    onClose();
  };

  return (
    // The calendar dropdown renders in a portal, but React's synthetic events
    // still bubble through the component tree, not the DOM tree — without
    // this, a day click would also re-trigger the cell's own onClick (which
    // enters edit mode), undoing the close() below on the same click.
    <div onClick={(e) => e.stopPropagation()}>
      <DatePickerInput
        size="xs"
        aria-label={ariaLabel}
        value={value}
        popoverProps={{ opened, onClose: close }}
        onChange={(date) => {
          if (date && date !== value) {
            void onSave(date);
          }
          close();
        }}
      />
    </div>
  );
}
