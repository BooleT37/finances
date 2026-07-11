import { Button } from '@mantine/core';
import { IconBrandGoogle } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { authClient } from '~/lib/auth/client';

export function GoogleSignInButton() {
  const { t } = useTranslation('auth');
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    setIsPending(true);
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/transactions',
    });
  }

  return (
    <Button
      variant="default"
      leftSection={<IconBrandGoogle size={16} />}
      loading={isPending}
      fullWidth
      onClick={handleClick}
    >
      {t('form.signInWithGoogle')}
    </Button>
  );
}
