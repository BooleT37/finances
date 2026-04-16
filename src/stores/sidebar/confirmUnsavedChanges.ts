import { openConfirmModal } from '@mantine/modals';

export function confirmUnsavedChanges(onConfirm: () => void): void {
  openConfirmModal({
    title: 'Несохранённые изменения',
    children: 'Есть несохранённые изменения. Хотите продолжить без сохранения?',
    labels: { confirm: 'Продолжить', cancel: 'Отмена' },
    confirmProps: { color: 'red' },
    onConfirm,
  });
}
