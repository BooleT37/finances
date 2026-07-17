import {
  ActionIcon,
  Button,
  CopyButton,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCreateProjectUser } from '../queries';
import type { CreatedProjectUser, CreateProjectUserInput } from '../schema';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function CreateProjectUserModal({ opened, onClose }: Props) {
  const { t } = useTranslation('projectUsers');
  const createMutation = useCreateProjectUser();
  const [createdUser, setCreatedUser] = useState<CreatedProjectUser | null>(
    null,
  );

  const form = useForm<CreateProjectUserInput>({
    initialValues: { name: '', email: '', role: 'user' },
    validate: {
      name: (value) => (value.trim() ? null : t('validation.nameRequired')),
      email: (value) =>
        /^\S+@\S+\.\S+$/.test(value) ? null : t('validation.emailInvalid'),
    },
  });

  function handleSubmit(values: CreateProjectUserInput) {
    createMutation.mutate(values, {
      onSuccess: (user) => {
        setCreatedUser(user);
        form.reset();
      },
      onError: () =>
        notifications.show({
          color: 'red',
          message: t('notifications.createError'),
        }),
    });
  }

  function handleClose() {
    setCreatedUser(null);
    onClose();
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={createdUser ? t('modal.createdTitle') : t('modal.addTitle')}
      closeOnClickOutside={!createdUser}
      closeOnEscape={!createdUser}
    >
      {createdUser ? (
        <Stack gap="md">
          <Text size="sm">{t('modal.createdWarning')}</Text>
          <TextInput
            label={t('form.generatedPassword')}
            value={createdUser.password}
            readOnly
            rightSection={
              <CopyButton value={createdUser.password}>
                {({ copied, copy }) => (
                  <Tooltip
                    label={
                      copied
                        ? t('actions.passwordCopied')
                        : t('actions.copyPassword')
                    }
                  >
                    <ActionIcon
                      variant="subtle"
                      color={copied ? 'teal' : 'gray'}
                      aria-label={t('actions.copyPassword')}
                      onClick={copy}
                    >
                      {copied ? (
                        <IconCheck size={16} />
                      ) : (
                        <IconCopy size={16} />
                      )}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            }
          />
          <Button onClick={handleClose} fullWidth>
            {t('modal.done')}
          </Button>
        </Stack>
      ) : (
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
      )}
    </Modal>
  );
}
