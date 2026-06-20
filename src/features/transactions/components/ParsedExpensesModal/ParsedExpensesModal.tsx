import { Alert, Button, Checkbox, Group, Modal, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useQuery } from '@tanstack/react-query';
import { type Dayjs } from 'dayjs';
import Decimal from 'decimal.js';
import { useAtomValue } from 'jotai';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { parseCategorySubcategoryId } from '~/features/categories/categorySubcategoryId';
import { getSubscriptionsQueryOptions } from '~/features/subscriptions/queries';
import type { ParsedExpense } from '~/features/transactions/parsedExpense';
import { getTransactionsQueryOptions } from '~/features/transactions/queries';
import { useImportTransactions } from '~/features/transactions/queries';
import { API_DATE_FORMAT } from '~/shared/constants';
import { TableFlash, useFlashTrigger } from '~/shared/hooks/useTableFlash';
import { findByIdOrThrow } from '~/shared/utils/getOrThrow';
import { selectedYearAtom } from '~/stores/month';

import {
  isSubscriptionValue,
  type ParsedExpenseCategoryValue,
  parseSubscriptionValue,
} from './parsedExpenseCategoryTree';
import { ParsedExpenseRow } from './ParsedExpenseRow';
import styles from './ParsedExpensesModal.module.css';

export interface ParsedExpenseRowValues {
  selected: boolean;
  date: Dayjs | null;
  type: string;
  description: string;
  amount: string;
  categorySubcategoryId: ParsedExpenseCategoryValue | null;
}

export interface ParsedExpenseFormValues {
  expenses: ParsedExpenseRowValues[];
}

const gridColumns = '24px 2fr 3fr 8fr 100px 4fr';
const gridGap = '8px 12px';

const stickyHeaderRowStyle: React.CSSProperties = {
  gridColumn: '1 / -1',
  position: 'sticky',
  top: 0,
  background: 'var(--mantine-color-body)',
  zIndex: 1,
  paddingBlock: 4,
};

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
  const { data: subscriptions = [] } = useQuery(getSubscriptionsQueryOptions());
  const importTransactions = useImportTransactions();
  const triggerFlash = useFlashTrigger(TableFlash.Transactions);

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

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [duplicateAlertHidden, setDuplicateAlertHidden] = useState(false);

  const expenses = form.values.expenses;
  const allSelected = expenses.length > 0 && expenses.every((e) => e.selected);
  const someSelected = expenses.some((e) => e.selected);
  const noneSelected = !someSelected;

  const scrollToFirstError = useCallback((firstErrorIndex: number) => {
    if (!scrollContainerRef.current) {
      return;
    }
    const container = scrollContainerRef.current;
    const rowEl = container.querySelector<HTMLElement>(
      `[data-expense-row="${firstErrorIndex}"]`,
    );
    const targetEl = rowEl?.firstElementChild as HTMLElement | null;
    if (!targetEl) {
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const elRect = targetEl.getBoundingClientRect();
    const stickyHeader = container.querySelector<HTMLElement>(
      '[data-sticky-header]',
    );
    const headerHeight = stickyHeader?.getBoundingClientRect().height ?? 0;
    const visibleTop = containerRect.top + headerHeight;
    const visibleBottom = containerRect.bottom;
    const scrollPadding = 8;
    if (elRect.top < visibleTop) {
      container.scrollTop += elRect.top - visibleTop - scrollPadding;
    } else if (elRect.bottom > visibleBottom) {
      container.scrollTop += elRect.bottom - visibleBottom + scrollPadding;
    }
  }, []);

  const handleToggleAll = () => {
    form.setFieldValue(
      'expenses',
      expenses.map((e) => ({ ...e, selected: !allSelected })),
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const values = form.values;
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

      const firstErrorIndex = values.expenses.findIndex(
        (e) =>
          e.selected && (!e.date || !e.description || !e.categorySubcategoryId),
      );
      if (firstErrorIndex >= 0) {
        scrollToFirstError(firstErrorIndex);
      }

      return;
    }

    const items = selected.map((e) => {
      const value = e.categorySubcategoryId!;
      let categoryId: number;
      let subcategoryId: number | null;
      let subscriptionId: number | null = null;
      if (isSubscriptionValue(value)) {
        subscriptionId = parseSubscriptionValue(value);
        const subscription = findByIdOrThrow(
          subscriptions,
          subscriptionId,
          'Subscription',
        );
        categoryId = subscription.categoryId;
        subcategoryId = subscription.subcategoryId;
      } else {
        ({ categoryId, subcategoryId } = parseCategorySubcategoryId(value));
      }
      return {
        name: e.description,
        cost: new Decimal(e.amount).abs().toFixed(2),
        date: e.date!.format(API_DATE_FORMAT),
        categoryId,
        subcategoryId,
        subscriptionId,
        sourceId,
        peHash:
          parsedExpenses.find(
            (p) =>
              p.description === e.description &&
              p.amount.toFixed(2) === e.amount,
          )?.hash ?? '',
      };
    });

    const created = await importTransactions.mutateAsync(items);
    triggerFlash(created.map((tx) => ({ id: tx.id })));
    notifications.show({
      color: 'green',
      message: t('importModal.success', { count: created.length }),
    });
    onClose();
  };

  return (
    <Modal
      opened
      onClose={onClose}
      title={t('importModal.title')}
      size={1200}
      centered
      styles={{
        content: { display: 'flex', flexDirection: 'column' },
        body: {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
        },
      }}
    >
      {hasDuplicates && !duplicateAlertHidden && (
        <Alert
          color="yellow"
          mb="md"
          p="xs"
          style={{ flexShrink: 0 }}
          withCloseButton
          onClose={() => setDuplicateAlertHidden(true)}
        >
          {t('importModal.duplicateWarning')}
        </Alert>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
        }}
      >
        <div
          ref={scrollContainerRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            minHeight: 0,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: gridColumns,
              gap: gridGap,
              alignItems: 'start',
            }}
          >
            <div
              data-sticky-header
              className={styles.stickyHeader}
              style={stickyHeaderRowStyle}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: gridColumns,
                  gap: gridGap,
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
              </div>
            </div>

            {expenses.map((_, index) => (
              <ParsedExpenseRow key={index} index={index} form={form} />
            ))}
          </div>
        </div>

        <Group justify="flex-end" mt="md" style={{ flexShrink: 0 }}>
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
