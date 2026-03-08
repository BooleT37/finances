import { Anchor, Button, Input, Select, Stack, TextInput } from '@mantine/core';
import { isNotEmpty, useForm } from '@mantine/form';
import {
  IconMoneybagMinus,
  IconMoneybagPlus,
  IconPigMoney,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useMolecule } from 'bunshi/react';
import dayjs from 'dayjs';
import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  getExpenseCategoriesQueryOptions,
  getIncomeCategoriesQueryOptions,
} from '~/features/categories/facets/categoriesByType';
import { getCategoryMapQueryOptions } from '~/features/categories/facets/categoryMap';
import { getSourcesQueryOptions } from '~/features/sources/queries';
import { useAvailableSubscriptions } from '~/features/subscriptions/facets/availableSubscriptions';
import { DatePickerWithTodayInput } from '~/shared/components/DatePickerWithTodayInput';
import { SegmentedControlWithIcons } from '~/shared/components/SegmentedControlWithIcons';
import { TextWithTooltipIcon } from '~/shared/components/TextWithTooltipIcon';
import { findByIdOrThrow, getOrThrow } from '~/shared/utils/getOrThrow';
import { getToday } from '~/shared/utils/today';
import { selectedMonthAtom } from '~/stores/month';

import { insertedTransactionAtom } from '../../TransactionsTable/flashTransaction';
import { TransactionSidebarMolecule } from '../transactionSidebarMolecule';
import { SourceLastTransactions } from './SourceLastTransactions';
import type {
  TransactionFormValues,
  ValidatedTransactionFormValues,
} from './transactionFormValues';
import { transactionToFormValues } from './transactionToFormValues';

const costRegex = /^-?\d+(?:\.\d+)?$/;

export function TransactionSidebarForm() {
  const {
    editingIdAtom,
    currentTransactionAtom,
    actualDateShownAtom,
    formRefAtom,
    insertTransactionAtom,
    closeAtom,
  } = useMolecule(TransactionSidebarMolecule);

  const editingId = useAtomValue(editingIdAtom);
  const currentTransaction = useAtomValue(currentTransactionAtom);
  const actualDateShown = useAtomValue(actualDateShownAtom);
  const setActualDateShown = useSetAtom(actualDateShownAtom);
  const insertTransaction = useSetAtom(insertTransactionAtom);
  const close = useSetAtom(closeAtom);
  const setInsertedTransaction = useSetAtom(insertedTransactionAtom);
  const setFormRef = useSetAtom(formRefAtom);

  const { data: categoryMap = {} } = useQuery(getCategoryMapQueryOptions());
  const { data: expenseCategories = [] } = useQuery(
    getExpenseCategoriesQueryOptions(),
  );
  const { data: incomeCategories = [] } = useQuery(
    getIncomeCategoriesQueryOptions(),
  );
  const { data: sources = [] } = useQuery(getSourcesQueryOptions());
  const selectedMonth = useAtomValue(selectedMonthAtom);
  const emptyTransactionFormValues = useMemo(
    (): TransactionFormValues => ({
      cost: '',
      name: '',
      date: dayjs(selectedMonth).isSame(getToday(), 'month')
        ? getToday().toDate()
        : dayjs(selectedMonth).startOf('month').toDate(),
      actualDate: null,
      category: null,
      subcategory: null,
      source: null,
      subscription: null,
      savingSpendingCategoryId: null,
    }),
    [selectedMonth],
  );

  const [transactionType, setTransactionType] = useState(() => {
    if (!currentTransaction) {
      return 'expense';
    }
    const cat = getOrThrow(
      categoryMap,
      currentTransaction.categoryId,
      'Category',
    );
    return cat.isIncome ? 'income' : 'expense';
  });

  const categories =
    transactionType === 'income'
      ? incomeCategories
      : expenseCategories.filter((c) => c.type !== 'TO_SAVINGS');

  const { t } = useTranslation('transactions');

  const form = useForm<TransactionFormValues>({
    initialValues: currentTransaction
      ? transactionToFormValues(currentTransaction)
      : emptyTransactionFormValues,
    validate: {
      date: isNotEmpty(t('form.errors.dateRequired')),
      actualDate: (v, values) => {
        if (!actualDateShown || !v || !values.date) {
          return null;
        }
        return v.toDateString() === values.date.toDateString()
          ? t('form.errors.actualDateSameAsDate')
          : null;
      },
      category: isNotEmpty(t('form.errors.categoryRequired')),
      cost: (v) => (costRegex.test(v) ? null : t('form.errors.invalidAmount')),
    },
  });

  useEffect(() => {
    setFormRef(form);
    return () => setFormRef(null);
  }, [form, setFormRef]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (form.isDirty()) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [form]);

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: String(c.id), label: c.name })),
    [categories],
  );

  const selectedCategory = useMemo(() => {
    if (form.values.category === null) {
      return undefined;
    }
    return getOrThrow(categoryMap, Number(form.values.category), 'Category');
  }, [categoryMap, form.values.category]);

  const subcategoryOptions = useMemo(
    () =>
      selectedCategory?.subcategories.map((s) => ({
        value: String(s.id),
        label: s.name,
      })) ?? [],
    [selectedCategory],
  );

  const sourceOptions = useMemo(
    () => sources.map((s) => ({ value: String(s.id), label: s.name })),
    [sources],
  );

  const availableSubscriptions = useAvailableSubscriptions(
    form.values.category !== null ? Number(form.values.category) : undefined,
    editingId,
  );

  const subscriptionOptions = useMemo(
    () =>
      (availableSubscriptions ?? []).map((s) => ({
        value: String(s.subscription.id),
        label: s.subscription.name,
      })),
    [availableSubscriptions],
  );

  const autofillSubscriptionFields = useCallback(
    (subscriptionId: string) => {
      if (!availableSubscriptions) {
        return;
      }
      const sub = findByIdOrThrow(
        availableSubscriptions.map((s) => s.subscription),
        Number(subscriptionId),
        'Subscription',
      );
      form.setFieldValue('name', sub.name);
      form.setFieldValue('cost', sub.cost.toString());
      form.setFieldValue(
        'source',
        sub.sourceId !== null ? String(sub.sourceId) : null,
      );
    },
    [availableSubscriptions, form],
  );

  const handleTypeChange = (value: string) => {
    setTransactionType(value as 'expense' | 'income' | 'fromSavings');
    form.setFieldValue('category', null);
    form.setFieldValue('subcategory', null);
  };

  const sourceDescription =
    form.values.source === null ? undefined : (
      <SourceLastTransactions sourceId={Number(form.values.source)} />
    );

  const handleSubmit = form.onSubmit(async (values) => {
    const tx = await insertTransaction(
      values as ValidatedTransactionFormValues,
    );
    setInsertedTransaction(tx);
    form.reset();
    close();
  });

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="sm">
        <Input.Wrapper label={t('form.type.label')}>
          <SegmentedControlWithIcons
            value={transactionType}
            onChange={handleTypeChange}
            data={[
              {
                label: t('form.type.expense'),
                value: 'expense',
                icon: <IconMoneybagMinus size={18} />,
              },
              {
                label: t('form.type.income'),
                value: 'income',
                icon: <IconMoneybagPlus size={18} />,
              },
              {
                label: t('form.type.fromSavings'),
                value: 'fromSavings',
                icon: <IconPigMoney size={18} />,
                disabled: true,
              },
            ]}
          />
        </Input.Wrapper>
        <DatePickerWithTodayInput
          label={t('form.date')}
          required
          {...form.getInputProps('date')}
        />

        {actualDateShown ? (
          <Stack gap={4}>
            <DatePickerWithTodayInput
              label={
                <TextWithTooltipIcon tooltip={t('form.actualDateDescription')}>
                  {t('form.actualDate')}
                </TextWithTooltipIcon>
              }
              clearable
              {...form.getInputProps('actualDate')}
            />
            <Anchor
              size="xs"
              onClick={() => {
                setActualDateShown(false);
                form.setFieldValue('actualDate', null);
              }}
            >
              {t('form.sameDate')}
            </Anchor>
          </Stack>
        ) : (
          <Anchor size="xs" onClick={() => setActualDateShown(true)}>
            {t('form.actualDateDiffers')}
          </Anchor>
        )}

        <Select
          label={t('form.category')}
          required
          data={categoryOptions}
          {...form.getInputProps('category')}
          onChange={(v) => {
            form.setFieldValue('category', v);
            form.setFieldValue('subcategory', null);
          }}
          searchable
        />

        {subcategoryOptions.length > 0 && (
          <Select
            label={t('form.subcategory')}
            data={subcategoryOptions}
            {...form.getInputProps('subcategory')}
            clearable
          />
        )}

        {subscriptionOptions.length > 0 && (
          <Select
            label={t('form.subscription')}
            data={subscriptionOptions}
            {...form.getInputProps('subscription')}
            clearable
            onChange={(v) => {
              form.setFieldValue('subscription', v);
              if (v !== null) {
                autofillSubscriptionFields(v);
              }
            }}
          />
        )}

        <TextInput
          label={t('form.amount')}
          required
          {...form.getInputProps('cost')}
        />

        <TextInput label={t('form.comment')} {...form.getInputProps('name')} />

        <Select
          label={t('form.source')}
          data={sourceOptions}
          {...form.getInputProps('source')}
          clearable
          description={sourceDescription}
        />

        <Button type="submit" mt="sm" disabled={!form.isDirty()}>
          {editingId === null ? t('form.add') : t('form.save')}
        </Button>
      </Stack>
    </form>
  );
}
