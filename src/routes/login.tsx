import { Center, Divider, Paper, Stack, Title } from '@mantine/core';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { fetchSession } from '~/features/auth/api';
import { GoogleSignInButton } from '~/features/auth/components/GoogleSignInButton';
import { LoginForm } from '~/features/auth/components/LoginForm';

function sanitizeRedirect(url: string | undefined): string {
  if (!url || !url.startsWith('/') || url.startsWith('//')) {
    return '/transactions';
  }
  return url;
}

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  beforeLoad: async ({ search }) => {
    const session = await fetchSession();
    if (session) {
      throw redirect({ to: sanitizeRedirect(search.redirect) });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const search = Route.useSearch();

  function handleSuccess() {
    void navigate({ to: sanitizeRedirect(search.redirect) });
  }

  return (
    <Center h="100vh">
      <Paper withBorder p="xl" w={360}>
        <Stack gap="lg">
          <Title order={2} ta="center">
            {t('pageTitle')}
          </Title>
          <LoginForm onSuccess={handleSuccess} />
          <Divider label={t('form.or')} />
          <GoogleSignInButton />
        </Stack>
      </Paper>
    </Center>
  );
}
