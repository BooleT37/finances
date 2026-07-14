import { Button, Modal, PasswordInput, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useRouteContext } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { useResetProjectUserPassword } from '../queries';
import type { ProjectUser } from '../schema';

interface Props {
  user: ProjectUser | null;
  onClose: () => void;
}

export function ResetPasswordModal({ user, onClose }: Props) {
  const { t } = useTranslation('projectUsers');
  const resetMutation = useResetProjectUserPassword();
  const { session } = useRouteContext({ from: '/_authenticated' });
  const isSelf = user !== null && user.id === session.userId;

  const form = useForm({
    initialValues: { password: '' },
    validate: {
      password: (value) =>
        value.length >= 8 ? null : t('validation.passwordTooShort'),
    },
  });

  function handleSubmit(values: { password: string }) {
    if (!user) {
      return;
    }
    resetMutation.mutate(
      { userId: user.id, password: values.password },
      {
        onSuccess: () => {
          notifications.show({
            color: 'green',
            message: t('notifications.passwordReset'),
          });
          form.reset();
          onClose();
        },
        onError: () =>
          notifications.show({
            color: 'red',
            message: t('notifications.passwordResetError'),
          }),
      },
    );
  }

  return (
    <Modal
      opened={user !== null}
      onClose={onClose}
      title={user ? t('modal.resetPasswordTitle', { name: user.name }) : ''}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <PasswordInput
            label={t('form.tempPassword')}
            description={
              isSelf
                ? t('form.newPasswordDescriptionSelf')
                : t('form.tempPasswordDescription')
            }
            required
            {...form.getInputProps('password')}
          />
          <Button type="submit" loading={resetMutation.isPending} fullWidth>
            {t('modal.save')}
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
