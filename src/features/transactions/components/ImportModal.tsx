import { Button, FileInput, Group, Modal, Select, Stack } from '@mantine/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { atom, useAtom, useAtomValue } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getSourcesQueryOptions } from '~/features/sources/queries';
import { parsePdfExpenses } from '~/features/transactions/api';
import {
  type ImportedTransaction,
  importedTransactionSchema,
} from '~/features/transactions/importedTransaction';
import { getTransactionsQueryOptions } from '~/features/transactions/queries';
import { selectedYearAtom } from '~/stores/month';

import { ImportedTransactionsModal } from './ImportedTransactionsModal/ImportedTransactionsModal';

export const importModalOpenAtom = atom(false);

export function ImportModal() {
  const { t } = useTranslation('transactions');
  const queryClient = useQueryClient();
  const selectedYear = useAtomValue(selectedYearAtom);
  const [open, setOpen] = useAtom(importModalOpenAtom);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [importedTransactions, setImportedTransactions] = useState<
    ImportedTransaction[] | null
  >(null);

  const { data: sources = [] } = useQuery(getSourcesQueryOptions());

  const sourcesWithParser = sources.filter((s) => s.parser !== null);
  const sourceOptions = sourcesWithParser.map((s) => ({
    value: String(s.id),
    label: s.name,
  }));

  const selectedSource = selectedSourceId
    ? (sources.find((s) => String(s.id) === selectedSourceId) ?? null)
    : null;

  const canParse = selectedSource !== null && file !== null && !loading;

  const handleParse = async () => {
    if (!selectedSource?.parser || !file) {
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
        data: { fileBase64: base64, parser: selectedSource.parser as 'VIVID' },
      });
      const decoded = rows.map((row) => importedTransactionSchema.decode(row));
      const previousYear = selectedYear - 1;
      if (decoded.some((row) => row.date.year() === previousYear)) {
        // ensure all the required years are loaded (we only care about the current and previous one)
        // so the ImportedTransactionsModal doesn't have to deal with the loading state
        await queryClient.ensureQueryData(
          getTransactionsQueryOptions(previousYear),
        );
      }
      setOpen(false);
      setImportedTransactions(decoded);
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
      <Modal opened={open} onClose={handleClose} title={t('importModal.title')}>
        <Stack gap="sm">
          <Select
            label={t('importModal.source')}
            placeholder={t('importModal.sourcePlaceholder')}
            data={sourceOptions}
            value={selectedSourceId}
            onChange={setSelectedSourceId}
          />

          <FileInput
            label={t('importModal.uploadLabel')}
            description={t('importModal.uploadDescription')}
            accept=".pdf"
            value={file}
            onChange={setFile}
            disabled={!selectedSource}
          />

          <Group justify="flex-end">
            <Button
              onClick={handleParse}
              loading={loading}
              disabled={!canParse}
            >
              {t('importModal.parse')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {importedTransactions && selectedSource && (
        <ImportedTransactionsModal
          importedTransactions={importedTransactions}
          sourceId={selectedSource.id}
          onClose={handleReviewClose}
        />
      )}
    </>
  );
}
