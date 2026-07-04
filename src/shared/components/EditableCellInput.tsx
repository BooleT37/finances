import { TextInput } from '@mantine/core';
import { useState } from 'react';

interface EditableCellInputProps {
  'aria-label'?: string;
  initialValue: string;
  isValid?: (value: string) => boolean;
  onClose: () => void;
  onSave: (value: string) => Promise<unknown>;
}

export function EditableCellInput({
  'aria-label': ariaLabel,
  initialValue,
  isValid,
  onClose,
  onSave,
}: EditableCellInputProps) {
  const [draft, setDraft] = useState(initialValue);
  const [invalid, setInvalid] = useState(false);

  const commit = () => {
    onClose();
    if (invalid) {
      return;
    }
    void onSave(draft);
  };

  return (
    <TextInput
      aria-label={ariaLabel}
      value={draft}
      onChange={(e) => {
        const next = e.currentTarget.value;
        setDraft(next);
        setInvalid(isValid ? !isValid(next) : false);
      }}
      onBlur={commit}
      size="xs"
      autoFocus
      onFocus={(e) => e.currentTarget.select()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === 'Escape') {
          e.currentTarget.blur();
        }
      }}
      error={invalid}
      styles={{
        input: invalid
          ? { backgroundColor: 'var(--mantine-color-red-0)' }
          : undefined,
      }}
    />
  );
}
