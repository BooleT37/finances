import {
  Alert,
  Button,
  Group,
  Loader,
  Paper,
  Radio,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Link, useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  useCompleteBankAuth,
  useSelectBankAccount,
} from '~/features/import/queries';

interface Props {
  code?: string;
  state?: string;
  error?: string;
}

export function BankCallbackPage({ code, state, error }: Props) {
  const { t } = useTranslation('import');
  const navigate = useNavigate();
  const completeAuth = useCompleteBankAuth();
  const { mutate: complete } = completeAuth;
  const selectAccount = useSelectBankAccount();
  const [accountUid, setAccountUid] = useState<string | null>(null);
  // The authorization code works only once, so the request must not repeat
  // when React runs the effect twice in development.
  const completionStarted = useRef(false);

  const finish = useCallback(() => {
    notifications.show({
      color: 'green',
      message: t('bankCallback.connected'),
    });
    void navigate({ to: '/settings/sources', replace: true });
  }, [navigate, t]);

  const loginCancelled = Boolean(error) || !code || !state;

  useEffect(() => {
    if (completionStarted.current || loginCancelled || !code || !state) {
      return;
    }
    completionStarted.current = true;
    complete(
      { code, state },
      {
        onSuccess: (result) => {
          if (result.accounts.length === 0) {
            finish();
          }
        },
      },
    );
  }, [code, state, loginCancelled, complete, finish]);

  const backToSources = (
    <Button
      component={Link}
      to="/settings/sources"
      variant="default"
      style={{ alignSelf: 'flex-start' }}
    >
      {t('bankCallback.backToSources')}
    </Button>
  );

  if (loginCancelled || completeAuth.isError) {
    return (
      <Paper maw={480} p="lg" withBorder>
        <Stack>
          <Title order={3}>{t('bankCallback.title')}</Title>
          <Alert color="red">
            {loginCancelled
              ? t('bankCallback.cancelled')
              : t('bankCallback.failed')}
          </Alert>
          {backToSources}
        </Stack>
      </Paper>
    );
  }

  if (!completeAuth.data) {
    return (
      <Group gap="sm">
        <Loader size="sm" />
        <Text>{t('bankCallback.connecting')}</Text>
      </Group>
    );
  }

  const { sourceId, accounts } = completeAuth.data;

  return (
    <Paper maw={480} p="lg" withBorder>
      <Stack>
        <Title order={3}>{t('bankCallback.title')}</Title>
        <Radio.Group
          label={t('bankCallback.pickAccount')}
          value={accountUid}
          onChange={setAccountUid}
        >
          <Stack gap="xs" mt="xs">
            {accounts.map((account) => (
              <Radio
                key={account.uid}
                value={account.uid}
                label={account.label}
              />
            ))}
          </Stack>
        </Radio.Group>
        {selectAccount.isError && (
          <Alert color="red">{t('bankCallback.failed')}</Alert>
        )}
        <Button
          style={{ alignSelf: 'flex-start' }}
          disabled={!accountUid}
          loading={selectAccount.isPending}
          onClick={() => {
            if (accountUid) {
              selectAccount.mutate(
                { sourceId, accountUid },
                { onSuccess: finish },
              );
            }
          }}
        >
          {t('bankCallback.useAccount')}
        </Button>
      </Stack>
    </Paper>
  );
}
