import {
  ActionIcon,
  Group,
  TextInput,
  Title,
  type TitleOrder,
  Tooltip,
} from '@mantine/core';
import { IconCheck, IconPencil, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  /** Rendered before the value when not editing, e.g. "Проект ". */
  prefix?: string;
  value: string;
  /** When false, renders as a plain title with no edit affordance at all. */
  editable?: boolean;
  /** Accessible label for the edit (pencil) button, e.g. "Rename project". */
  editLabel: string;
  /** Awaited: rejecting keeps editing open, resolving closes it. The caller
   * is responsible for surfacing any error (e.g. a notification). */
  onSave: (newValue: string) => Promise<void>;
  order?: TitleOrder;
}

/**
 * A title that turns into a text input (with confirm/cancel icon buttons) on
 * click of a small pencil icon. There's no ready-made Mantine component for
 * this pattern.
 */
export function EditableTitle({
  prefix,
  value,
  editable = true,
  editLabel,
  onSave,
  order = 3,
}: Props) {
  const { t } = useTranslation('common');
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [isPending, setIsPending] = useState(false);

  function startEditing() {
    setDraft(value);
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraft(value);
    setIsEditing(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || trimmed === value) {
      setIsEditing(false);
      return;
    }
    setIsPending(true);
    try {
      await onSave(trimmed);
      setIsEditing(false);
    } catch {
      // Left open — the caller surfaces the error (e.g. a notification).
    } finally {
      setIsPending(false);
    }
  }

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit}>
        <Group gap="xs">
          <TextInput
            value={draft}
            onChange={(e) => setDraft(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Escape' && cancelEditing()}
            autoFocus
            size="md"
          />
          <ActionIcon
            type="submit"
            variant="subtle"
            color="green"
            loading={isPending}
            aria-label={t('inlineEdit.confirm')}
          >
            <IconCheck size={18} />
          </ActionIcon>
          <ActionIcon
            type="button"
            variant="subtle"
            color="red"
            onClick={cancelEditing}
            aria-label={t('inlineEdit.cancel')}
          >
            <IconX size={18} />
          </ActionIcon>
        </Group>
      </form>
    );
  }

  return (
    <Group gap="xs">
      <Title order={order}>
        {prefix}
        {value}
      </Title>
      {editable && (
        <Tooltip label={editLabel}>
          <ActionIcon
            variant="subtle"
            onClick={startEditing}
            aria-label={editLabel}
          >
            <IconPencil size={16} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
}
