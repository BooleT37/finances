import { Button, PasswordInput, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { authClient } from '~/lib/auth/client';

interface FormValues {
  email: string;
  password: string;
}

interface Props {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: Props) {
  const { t } = useTranslation('auth');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    initialValues: { email: '', password: '' },
    validate: {
      email: (value) => (value.trim() ? null : t('validation.emailRequired')),
      password: (value) =>
        value.trim() ? null : t('validation.passwordRequired'),
    },
  });

  async function handleSubmit(values: FormValues) {
    setError(null);
    setIsPending(true);
    const { error: signInError } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });
    setIsPending(false);
    if (signInError) {
      setError(t('errors.invalidCredentials'));
      return;
    }
    onSuccess();
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <TextInput
          label={t('form.email')}
          type="email"
          required
          autoComplete="email"
          {...form.getInputProps('email')}
        />
        <PasswordInput
          label={t('form.password')}
          required
          autoComplete="current-password"
          {...form.getInputProps('password')}
        />
        {error && (
          <Stack gap={0} c="red">
            {error}
          </Stack>
        )}
        <Button type="submit" loading={isPending} fullWidth>
          {t('form.submit')}
        </Button>
      </Stack>
    </form>
  );
}
