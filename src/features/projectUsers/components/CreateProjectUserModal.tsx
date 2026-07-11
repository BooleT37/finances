import {
  Button,
  Modal,
  PasswordInput,
  Select,
  Stack,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';

import { useCreateProjectUser } from '../queries';
import type { CreateProjectUserInput } from '../schema';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function CreateProjectUserModal({ opened, onClose }: Props) {
  const { t } = useTranslation('projectUsers');
  const createMutation = useCreateProjectUser();

  const form = useForm<CreateProjectUserInput>({
    initialValues: { name: '', email: '', password: '', role: 'user' },
    validate: {
      name: (value) => (value.trim() ? null : t('validation.nameRequired')),
      email: (value) =>
        /^\S+@\S+\.\S+$/.test(value) ? null : t('validation.emailInvalid'),
      password: (value) =>
        value.length >= 8 ? null : t('validation.passwordTooShort'),
    },
  });

  function handleSubmit(values: CreateProjectUserInput) {
    createMutation.mutate(values, {
      onSuccess: () => {
        notifications.show({
          color: 'green',
          message: t('notifications.created'),
        });
        form.reset();
        onClose();
      },
      onError: () =>
        notifications.show({
          color: 'red',
          message: t('notifications.createError'),
        }),
    });
  }

  return (
    <Modal opened={opened} onClose={onClose} title={t('modal.addTitle')}>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label={t('form.name')}
            required
            {...form.getInputProps('name')}
          />
          <TextInput
            label={t('form.email')}
            type="email"
            required
            {...form.getInputProps('email')}
          />
          <PasswordInput
            label={t('form.tempPassword')}
            description={t('form.tempPasswordDescription')}
            required
            {...form.getInputProps('password')}
          />
          <Select
            label={t('form.role')}
            data={[
              { value: 'user', label: t('roles.user') },
              { value: 'admin', label: t('roles.admin') },
            ]}
            allowDeselect={false}
            {...form.getInputProps('role')}
          />
          <Button type="submit" loading={createMutation.isPending} fullWidth>
            {t('modal.save')}
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
