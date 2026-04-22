import { openConfirmModal } from '@mantine/modals';

export function confirmUnsavedChanges(onConfirm: () => void): void {
  openConfirmModal({
    title: 'Несохранённые изменения',
    children: 'Есть несохранённые изменения. Отменить их?',
    labels: { confirm: 'Отменить', cancel: 'Продолжить редактирование' },
    confirmProps: { color: 'red' },
    onConfirm,
  });
}
