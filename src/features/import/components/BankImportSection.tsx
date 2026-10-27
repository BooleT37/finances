import {
  Alert,
  Anchor,
  Button,
  Group,
  Input,
  Stack,
  Text,
} from '@mantine/core';
import { Link, useRouteContext } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { BankConnection } from '~/features/import/bankConnectionSchema';
import type { ImportedTransaction } from '~/features/import/importedTransaction';
import { useFetchBankTransactions } from '~/features/import/queries';
import { DatePickerWithTodayInput } from '~/shared/components/DatePickerWithTodayInput';
import { DATE_FORMAT, ISO_DATE_FORMAT } from '~/shared/constants';

// Repeat imports start a little before the previous one, to catch rows the
// bank published a day after booking them. Rows already imported are
// recognised by their hash, so the overlap only adds unticked rows.
const REPEAT_IMPORT_OVERLAP_DAYS = 2;

const initialDateFrom = (connection: BankConnection) =>
  (connection.lastImportedAt
    ? connection.lastImportedAt.subtract(REPEAT_IMPORT_OVERLAP_DAYS, 'day')
    : dayjs().startOf('month')
  ).format(ISO_DATE_FORMAT);

interface Props {
  connection: BankConnection;
  onFetched: (transactions: ImportedTransaction[]) => Promise<void>;
}

export function BankImportSection({ connection, onFetched }: Props) {
  const { t } = useTranslation('import');
  const { session } = useRouteContext({ from: '/_authenticated' });
  const dateFromId = useId();
  const fetchTransactions = useFetchBankTransactions();
  const [dateFrom, setDateFrom] = useState<string | null>(() =>
    initialDateFrom(connection),
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
          maxDate={dayjs().format(ISO_DATE_FORMAT)}
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
