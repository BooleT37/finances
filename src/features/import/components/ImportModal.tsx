import {
  Box,
  Button,
  Divider,
  FileInput,
  Group,
  Modal,
  Select,
  Stack,
  Text,
} from '@mantine/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { atom, useAtom, useAtomValue } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { parsePdfExpenses } from '~/features/import/api';
import { bankHasStatementParser } from '~/features/import/bankCapabilities';
import { useBankImportAvailable } from '~/features/import/components/BankConnection/useBankConnection';
import {
  type ImportedTransaction,
  importedTransactionSchema,
} from '~/features/import/importedTransaction';
import { getBankConnectionsQueryOptions } from '~/features/import/queries';
import { getSourcesQueryOptions } from '~/features/sources/queries';
import { getTransactionsQueryOptions } from '~/features/transactions/queries';
import { selectedYearAtom } from '~/stores/month';

import { BankImportSection } from './BankImportSection';
import { ImportedTransactionsModal } from './ImportedTransactionsModal/ImportedTransactionsModal';

export const importModalOpenAtom = atom(false);

export function ImportModal() {
  const { t } = useTranslation('import');
  const queryClient = useQueryClient();
  const selectedYear = useAtomValue(selectedYearAtom);
  const [open, setOpen] = useAtom(importModalOpenAtom);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [importedTransactions, setImportedTransactions] = useState<
    ImportedTransaction[] | null
  >(null);
  const [importingFromBank, setImportingFromBank] = useState(false);

  const { data: sources = [] } = useQuery(getSourcesQueryOptions());
  const bankImportAvailable = useBankImportAvailable();
  const { data: bankConnections = [] } = useQuery({
    ...getBankConnectionsQueryOptions(),
    enabled: bankImportAvailable,
  });

  const importableBankConnection = (sourceId: number) =>
    bankConnections.find(
      (connection) => connection.sourceId === sourceId && connection.hasAccount,
    ) ?? null;

  const importableSources = sources.filter(
    (s) =>
      bankHasStatementParser(s.bank) || importableBankConnection(s.id) !== null,
  );
  const sourceOptions = importableSources.map((s) => ({
    value: String(s.id),
    label: s.name,
  }));

  const selectedSource = selectedSourceId
    ? (sources.find((s) => String(s.id) === selectedSourceId) ?? null)
    : null;
  const selectedBankConnection = selectedSource
    ? importableBankConnection(selectedSource.id)
    : null;
  const showStatementUpload =
    !selectedSource || bankHasStatementParser(selectedSource.bank);
  const showBothOptions =
    showStatementUpload && selectedBankConnection !== null;

  const openReview = async (rows: ImportedTransaction[], fromBank: boolean) => {
    const previousYear = selectedYear - 1;
    if (rows.some((row) => row.date.year() === previousYear)) {
      // ensure all the required years are loaded (we only care about the current and previous one)
      // so the ImportedTransactionsModal doesn't have to deal with the loading state
      await queryClient.ensureQueryData(
        getTransactionsQueryOptions(previousYear),
      );
    }
    setOpen(false);
    setImportingFromBank(fromBank);
    setImportedTransactions(rows);
  };

  const canParse = selectedSource !== null && file !== null && !loading;

  const handleParse = async () => {
    if (!selectedSource || !file) {
      return;
    }
    setLoading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1] ?? '');
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const rows = await parsePdfExpenses({
        data: { sourceId: selectedSource.id, fileBase64: base64 },
      });
      await openReview(
        rows.map((row) => importedTransactionSchema.decode(row)),
        false,
      );
    } catch (err) {
      console.error('PDF parse error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFile(null);
  };

  const handleReviewClose = () => {
    setImportedTransactions(null);
    setSelectedSourceId(null);
    setFile(null);
  };

  return (
    <>
      <Modal
        opened={open}
        onClose={handleClose}
        title={t('importModal.title')}
        size={showBothOptions ? 880 : 'md'}
      >
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: showBothOptions ? '1fr auto 1fr' : '1fr',
            columnGap: 'var(--mantine-spacing-lg)',
            rowGap: 'var(--mantine-spacing-md)',
          }}
        >
          <Select
            label={t('importModal.source')}
            placeholder={t('importModal.sourcePlaceholder')}
            data={sourceOptions}
            value={selectedSourceId}
            onChange={setSelectedSourceId}
            style={{ gridColumn: 1 }}
          />

          {showStatementUpload && (
            <Stack
              gap="xs"
              style={{ gridRow: 2, gridColumn: showBothOptions ? 3 : 1 }}
            >
              <FileInput
                label={t('importModal.uploadLabel')}
                description={t('importModal.uploadDescription')}
                placeholder={t('importModal.uploadPlaceholder')}
                accept=".pdf"
                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                styles={{ description: { flex: 1 } }}
                value={file}
                onChange={setFile}
                disabled={!selectedSource}
              />

              <Group justify="flex-end" mt="auto">
                <Button
                  onClick={handleParse}
                  loading={loading}
                  disabled={!canParse}
                >
                  {t('importModal.parse')}
                </Button>
              </Group>
            </Stack>
          )}

          {showBothOptions && (
            <Stack gap={4} align="center" style={{ gridRow: 2, gridColumn: 2 }}>
              <Divider
                orientation="vertical"
                style={{ flex: 1, alignSelf: 'center' }}
              />
              <Text size="xs" c="dimmed">
                {t('importModal.or')}
              </Text>
              <Divider
                orientation="vertical"
                style={{ flex: 1, alignSelf: 'center' }}
              />
            </Stack>
          )}

          {selectedBankConnection && (
            <Stack style={{ gridRow: 2, gridColumn: 1 }}>
              <BankImportSection
                key={selectedBankConnection.sourceId}
                connection={selectedBankConnection}
                onFetched={(rows) => openReview(rows, true)}
              />
            </Stack>
          )}
        </Box>
      </Modal>

      {importedTransactions && selectedSource && (
        <ImportedTransactionsModal
          importedTransactions={importedTransactions}
          fromBank={importingFromBank}
          sourceId={selectedSource.id}
          onClose={handleReviewClose}
        />
      )}
    </>
  );
}
