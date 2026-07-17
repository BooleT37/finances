import { Button, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useRouteContext, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { authClient } from '~/lib/auth/client';

interface FormValues {
  name: string;
}

export function NameForm() {
  const { t } = useTranslation('account');
  const { session } = useRouteContext({ from: '/_authenticated' });
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<FormValues>({
    initialValues: { name: session.name },
    validate: {
      name: (value) => (value.trim() ? null : t('validation.nameRequired')),
    },
  });

  async function handleSubmit(values: FormValues) {
    setIsPending(true);
    const { error } = await authClient.updateUser({ name: values.name });
    setIsPending(false);
    if (error) {
      notifications.show({
        color: 'red',
        message: t('notifications.nameUpdateError'),
      });
      return;
    }
    notifications.show({
      color: 'green',
      message: t('notifications.nameUpdated'),
    });
    await router.invalidate();
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <TextInput
          label={t('form.name')}
          required
          {...form.getInputProps('name')}
        />
        <Button type="submit" loading={isPending}>
          {t('form.save')}
        </Button>
      </Stack>
    </form>
  );
}
