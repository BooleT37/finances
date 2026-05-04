import { Alert, Button, Checkbox, Group, Modal, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useQuery } from '@tanstack/react-query';
import { type Dayjs } from 'dayjs';
import Decimal from 'decimal.js';
import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  type CategorySubcategoryId,
  parseCategorySubcategoryId,
} from '~/features/categories/categorySubcategoryId';
import type { ParsedExpense } from '~/features/transactions/parsedExpense';
import { getTransactionsQueryOptions } from '~/features/transactions/queries';
import { useImportTransactions } from '~/features/transactions/queries';
import { selectedYearAtom } from '~/stores/month';

import { ParsedExpenseRow } from './ParsedExpenseRow';

export interface ParsedExpenseRowValues {
  selected: boolean;
  date: Dayjs | null;
  type: string;
  description: string;
  amount: string;
  categorySubcategoryId: CategorySubcategoryId | null;
}

export interface ParsedExpenseFormValues {
  expenses: ParsedExpenseRowValues[];
}

interface Props {
  parsedExpenses: ParsedExpense[];
  sourceId: number;
  onClose: () => void;
}

export function ParsedExpensesModal({
  parsedExpenses,
  sourceId,
  onClose,
}: Props) {
  const { t } = useTranslation('transactions');
  const selectedYear = useAtomValue(selectedYearAtom);
  const { data: existingTransactions = [] } = useQuery(
    getTransactionsQueryOptions(selectedYear),
  );
  const importTransactions = useImportTransactions();

  const isDuplicateFn = useMemo(
    () => (e: ParsedExpense) =>
      existingTransactions.some(
        (tx) =>
          (tx.peHash != null && tx.peHash === e.hash) ||
          (tx.date.isSame(e.date, 'day') && tx.cost.abs().eq(e.amount.abs())),
      ),
    [existingTransactions],
  );

  const { initialValues, hasDuplicates } = useMemo(() => {
    const expenses = parsedExpenses.map(
      (e): ParsedExpenseRowValues => ({
        selected: !isDuplicateFn(e),
        date: e.date,
        type: e.type,
        description: e.description,
        amount: e.amount.toFixed(2),
        categorySubcategoryId: null,
      }),
    );
    return {
      initialValues: { expenses },
      hasDuplicates: parsedExpenses.some((e) => isDuplicateFn(e)),
    };
  }, [parsedExpenses, isDuplicateFn]);

  const form = useForm<ParsedExpenseFormValues>({ initialValues });

  const expenses = form.values.expenses;
  const allSelected = expenses.length > 0 && expenses.every((e) => e.selected);
  const someSelected = expenses.some((e) => e.selected);
  const noneSelected = !someSelected;

  const handleToggleAll = () => {
    form.setFieldValue(
      'expenses',
      expenses.map((e) => ({ ...e, selected: !allSelected })),
    );
  };

  const handleSubmit = form.onSubmit(async (values) => {
    const selected = values.expenses.filter((e) => e.selected);

    const invalid = selected.some(
      (e) => !e.date || !e.description || !e.amount || !e.categorySubcategoryId,
    );
    if (invalid) {
      form.setErrors(
        Object.fromEntries(
          values.expenses.flatMap((e, i) => {
            if (!e.selected) {
              return [];
            }
            const errs: [string, string][] = [];
            if (!e.date) {
              errs.push([`expenses.${i}.date`, t('form.errors.dateRequired')]);
            }
            if (!e.description) {
              errs.push([
                `expenses.${i}.description`,
                t('form.errors.categoryRequired'),
              ]);
            }
            if (!e.categorySubcategoryId) {
              errs.push([
                `expenses.${i}.categorySubcategoryId`,
                t('form.errors.categoryRequired'),
              ]);
            }
            return errs;
          }),
        ),
      );
      return;
    }

    const items = selected.map((e) => {
      const { categoryId, subcategoryId } = parseCategorySubcategoryId(
        e.categorySubcategoryId!,
      );
      return {
        name: e.description,
        cost: new Decimal(e.amount).abs().toFixed(2),
        date: e.date!.format('YYYY-MM-DD'),
        categoryId,
        subcategoryId,
        sourceId,
        peHash:
          parsedExpenses.find(
            (p) =>
              p.description === e.description &&
              p.amount.toFixed(2) === e.amount,
          )?.hash ?? '',
      };
    });

    const count = await importTransactions.mutateAsync(items);
    notifications.show({
      color: 'green',
      message: t('importModal.success', { count }),
    });
    onClose();
  });

  return (
    <Modal opened onClose={onClose} title={t('importModal.title')} size={1200}>
      {hasDuplicates && (
        <Alert color="yellow" mb="md" p="xs">
          {t('importModal.duplicateWarning')}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '24px 2fr 3fr 8fr 100px 4fr',
            gap: '8px 12px',
            alignItems: 'center',
          }}
        >
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected && !allSelected}
            onChange={handleToggleAll}
          />
          <Text fw={700} size="sm">
            {t('importModal.columns.date')}
          </Text>
          <Text fw={700} size="sm">
            {t('importModal.columns.type')}
          </Text>
          <Text fw={700} size="sm">
            {t('importModal.columns.description')}
          </Text>
          <Text fw={700} size="sm">
            {t('importModal.columns.amount')}
          </Text>
          <Text fw={700} size="sm">
            {t('importModal.columns.category')}
          </Text>

          {expenses.map((_, index) => (
            <ParsedExpenseRow key={index} index={index} form={form} />
          ))}
        </div>

        <Group justify="flex-end" mt="md">
          <Button
            type="submit"
            loading={importTransactions.isPending}
            disabled={noneSelected}
          >
            {t('importModal.importButton')}
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
