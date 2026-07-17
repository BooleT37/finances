import { Button, PasswordInput, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { authClient } from '~/lib/auth/client';

interface FormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function ChangePasswordForm() {
  const { t } = useTranslation('auth');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validate: {
      currentPassword: (value) =>
        value ? null : t('changePassword.validation.currentRequired'),
      newPassword: (value) =>
        value.length >= 8 ? null : t('changePassword.validation.tooShort'),
      confirmPassword: (value, values) =>
        value === values.newPassword
          ? null
          : t('changePassword.validation.mismatch'),
    },
  });

  async function handleSubmit(values: FormValues) {
    setError(null);
    setIsPending(true);
    const { error: changeError } = await authClient.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
    setIsPending(false);
    if (changeError) {
      setError(t('changePassword.errors.invalidCurrentPassword'));
      return;
    }
    notifications.show({
      color: 'green',
      message: t('changePassword.success'),
    });
    form.reset();
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <PasswordInput
          label={t('changePassword.currentPassword')}
          required
          autoComplete="current-password"
          {...form.getInputProps('currentPassword')}
        />
        <PasswordInput
          label={t('changePassword.newPassword')}
          required
          autoComplete="new-password"
          {...form.getInputProps('newPassword')}
        />
        <PasswordInput
          label={t('changePassword.confirmPassword')}
          required
          autoComplete="new-password"
          {...form.getInputProps('confirmPassword')}
        />
        {error && (
          <Text size="sm" c="red">
            {error}
          </Text>
        )}
        <Button type="submit" loading={isPending}>
          {t('changePassword.submit')}
        </Button>
      </Stack>
    </form>
  );
}
