import {
  Anchor,
  Box,
  Center,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { LanguageSwitcher } from '~/components/LanguageSwitcher';
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
  const redirectTo = sanitizeRedirect(search.redirect);

  function handleSuccess() {
    void navigate({ to: redirectTo });
  }

  return (
    <Box pos="relative" h="100vh">
      <Group
        h={40}
        px="md"
        justify="flex-end"
        align="center"
        pos="absolute"
        top={0}
        right={0}
        left={0}
      >
        <LanguageSwitcher />
      </Group>
      <Center h="100%">
        <Stack gap="sm" align="center">
          <Paper withBorder p="xl" w={360}>
            <Stack gap="lg">
              <Title order={2} ta="center">
                {t('pageTitle')}
              </Title>
              <LoginForm onSuccess={handleSuccess} />
              <Divider label={t('form.or')} />
              <GoogleSignInButton callbackURL={redirectTo} />
            </Stack>
          </Paper>
          <Group gap="xs">
            <Anchor component={Link} to="/terms" size="xs" c="dimmed">
              {t('legal.terms')}
            </Anchor>
            <Text size="xs" c="dimmed">
              ·
            </Text>
            <Anchor component={Link} to="/privacy" size="xs" c="dimmed">
              {t('legal.privacy')}
            </Anchor>
          </Group>
        </Stack>
      </Center>
    </Box>
  );
}
