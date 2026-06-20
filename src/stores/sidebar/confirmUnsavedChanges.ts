import { openConfirmModal } from '@mantine/modals';

import i18n from '~/lib/i18n';

export function confirmUnsavedChanges(onConfirm: () => void): void {
  openConfirmModal({
    title: i18n.t('common:confirmUnsavedChanges.title'),
    children: i18n.t('common:confirmUnsavedChanges.message'),
    labels: {
      confirm: i18n.t('common:confirmUnsavedChanges.confirm'),
      cancel: i18n.t('common:confirmUnsavedChanges.cancel'),
    },
    confirmProps: { color: 'red' },
    onConfirm,
  });
}
