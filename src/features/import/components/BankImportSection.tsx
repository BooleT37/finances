import {
  Alert,
  Anchor,
  Button,
  Center,
  Group,
  Input,
  Loader,
  Stack,
  Text,
} from '@mantine/core';
import { Link, useRouteContext } from '@tanstack/react-router';
import type { Dayjs } from 'dayjs';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { BankConnection } from '~/features/import/bankConnectionSchema';
import { bankImportStartDate } from '~/features/import/bankImportStartDate';
import type { ImportedTransaction } from '~/features/import/importedTransaction';
import { useFetchBankTransactions } from '~/features/import/queries';
import { DatePickerWithTodayInput } from '~/shared/components/DatePickerWithTodayInput';
import { DATE_FORMAT, ISO_DATE_FORMAT } from '~/shared/constants';
import { getToday } from '~/shared/utils/today';

import { useLastImportedTransactionDate } from './useLastImportedTransactionDate';

interface Props {
  connection: BankConnection;
  onFetched: (transactions: ImportedTransaction[]) => Promise<void>;
}

export function BankImportSection({ connection, onFetched }: Props) {
  const lastImportedTransactionDate = useLastImportedTransactionDate(
    connection.sourceId,
  );

  if (lastImportedTransactionDate === undefined) {
    return (
      <Center style={{ flex: 1 }}>
        <Loader size="sm" />
      </Center>
    );
  }

  return (
    <BankImportForm
      connection={connection}
      lastImportedTransactionDate={lastImportedTransactionDate}
      onFetched={onFetched}
    />
  );
}

function BankImportForm({
  connection,
  lastImportedTransactionDate,
  onFetched,
}: Props & { lastImportedTransactionDate: Dayjs | null }) {
  const { t } = useTranslation('import');
  const { session } = useRouteContext({ from: '/_authenticated' });
  const dateFromId = useId();
  const fetchTransactions = useFetchBankTransactions();
  const [dateFrom, setDateFrom] = useState<string | null>(() =>
    bankImportStartDate({
      lastImportedAt: connection.lastImportedAt,
      lastImportedTransactionDate,
    }),
  );
  const [opening, setOpening] = useState(false);

  const result = fetchTransactions.data;

  const handleImport = () => {
    if (!dateFrom) {
      return;
    }
    fetchTransactions.mutate(
      { sourceId: connection.sourceId, dateFrom },
      {
        onSuccess: async (fetched) => {
          if (fetched.status === 'fetched' && fetched.transactions.length > 0) {
            setOpening(true);
            await onFetched(fetched.transactions);
            setOpening(false);
          }
        },
      },
    );
  };

  return (
    <Stack gap="xs" style={{ flex: 1 }}>
      <Stack gap={4} style={{ flex: 1 }}>
        <Input.Label>{t('importModal.bank.title')}</Input.Label>
        <Input.Description>
          {t('importModal.bank.description')}
        </Input.Description>
      </Stack>
      <Group gap="xs" wrap="nowrap">
        <Input.Label htmlFor={dateFromId} mb={0}>
          {t('importModal.bank.dateFrom')}
        </Input.Label>
        <DatePickerWithTodayInput
          id={dateFromId}
          value={dateFrom}
          onChange={setDateFrom}
          maxDate={getToday().format(ISO_DATE_FORMAT)}
          valueFormat={DATE_FORMAT}
          style={{ flex: 1 }}
        />
      </Group>
      {result?.status === 'expired' && (
        <Alert color="orange">
          {session.role === 'admin' ? (
            <>
              {t('importModal.bank.expired')}{' '}
              <Anchor component={Link} to="/settings/sources">
                {t('importModal.bank.reconnectLink')}
              </Anchor>
            </>
          ) : (
            t('importModal.bank.expiredAskAdmin')
          )}
        </Alert>
      )}
      {result?.status === 'fetched' && result.transactions.length === 0 && (
        <Text size="sm" c="dimmed">
          {t('importModal.bank.empty')}
        </Text>
      )}
      {fetchTransactions.isError && (
        <Alert color="red">{t('importModal.bank.failed')}</Alert>
      )}
      <Group justify="flex-end" mt="auto">
        <Button
          onClick={handleImport}
          loading={fetchTransactions.isPending || opening}
          disabled={!dateFrom}
        >
          {t('importModal.bank.import')}
        </Button>
      </Group>
    </Stack>
  );
}
