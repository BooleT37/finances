import { Alert, Button, Stack, TextInput } from '@mantine/core';
import { isNotEmpty, matches, useForm } from '@mantine/form';
import { useDebouncedCallback } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { useMolecule } from 'bunshi/react';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getFromSavingsCategoryQueryOptions } from '~/features/categories/facets/categoriesByType';
import { DatePickerWithTodayInput } from '~/shared/components/DatePickerWithTodayInput';

import { insertedTransactionAtom } from '../../TransactionsTable/flashTransaction';
import { TransactionSidebarMolecule } from '../transactionSidebarMolecule';
import { ActualDateField } from './fields/ActualDateField';
import { useActualDateValidator } from './fields/ActualDateField.validator';
import { CategoryFields } from './fields/CategoryFields';
import { CostField } from './fields/CostField/CostField';
import { SavingSpendingFields } from './fields/SavingSpendingFields';
import { SourceField } from './fields/SourceField/SourceField';
import { SubscriptionField } from './fields/SubscriptionField';
import { TransactionTypeField } from './fields/TransactionTypeField';
import type {
  TransactionFormTransform,
  TransactionFormValues,
  ValidatedTransactionFormValues,
} from './transactionFormValues';
import { useTransactionToFormValues } from './transactionToFormValues';
import { useEmptyTransactionFormValues } from './useEmptyTransactionFormValues';

const costRegex = /^-?\d+(?:\.\d+)?$/;

export function TransactionSidebarForm() {
  const {
    editingIdAtom,
    currentTransactionAtom,
    formRefAtom,
    saveTransactionAtom,
    closeAtom,
  } = useMolecule(TransactionSidebarMolecule);

  const editingId = useAtomValue(editingIdAtom);
  const currentTransaction = useAtomValue(currentTransactionAtom);
  const saveTransaction = useSetAtom(saveTransactionAtom);
  const close = useSetAtom(closeAtom);
  const setInsertedTransaction = useSetAtom(insertedTransactionAtom);
  const setFormRef = useSetAtom(formRefAtom);
  const store = useStore();

  const { data: fromSavingsCategory } = useQuery(
    getFromSavingsCategoryQueryOptions(),
  );

  const transformValues = useCallback<TransactionFormTransform>(
    (values) => {
      const validated = values as ValidatedTransactionFormValues;
      switch (validated.transactionType) {
        case 'fromSavings':
          if (!fromSavingsCategory) {
            return null;
          }
          return {
            ...validated,
            category: String(fromSavingsCategory.id),
            subcategory: null,
            subscription: null,
          };
        case 'income':
          return {
            ...validated,
            category: validated.incomeCategory,
            subcategory: validated.incomeSubcategory,
            savingSpendingCategoryId: null,
          };
        case 'expense':
          return {
            ...validated,
            category: validated.expenseCategory,
            subcategory: validated.expenseSubcategory,
            savingSpendingCategoryId: null,
          };
      }
    },
    [fromSavingsCategory],
  );

  const transactionToFormValues = useTransactionToFormValues();
  const emptyTransactionFormValues = useEmptyTransactionFormValues();

  const initialValues = useMemo((): TransactionFormValues => {
    if (!currentTransaction) {
      return emptyTransactionFormValues;
    }
    return transactionToFormValues(currentTransaction);
  }, [currentTransaction, emptyTransactionFormValues, transactionToFormValues]);

  const { t } = useTranslation('transactions');
  const validateActualDate = useActualDateValidator();

  // Auto-save when editing an existing transaction (600 ms debounce).
  // Skipped when the form is invalid (e.g. cost is mid-edit like "12.") or clean.
  const debouncedSave = useDebouncedCallback(async () => {
    const f = store.get(formRefAtom);
    if (editingId == null || !f?.isValid() || !f?.isDirty()) {
      return;
    }
    const prepared = f.getTransformedValues();
    if (!prepared) {
      return;
    }
    await saveTransaction(prepared);
    f.resetDirty();
    // NOTE: to make form values fully consistent with the BE (e.g. correct cost
    // signs after a round-trip), we would reset the form here with BE values:
    //   const updatedTx = await saveTransaction(prepared);
    //   const newValues = transactionToFormValues(updatedTx);
    //   f.setValues(newValues);
    //   f.resetDirty(newValues);
    // This was intentionally left out: the async delay would revert any changes
    // the user made while the save was in flight. Fixing this properly requires
    // disabling the form during saves, which adds friction we decided isn't worth it.
  }, 600);

  const form = useForm<TransactionFormValues, TransactionFormTransform>({
    initialValues,
    transformValues,
    validateInputOnBlur: true,
    validateInputOnChange: [
      'incomeCategory',
      'incomeSubcategory',
      'expenseCategory',
      'expenseSubcategory',
      'source',
      'subscription',
      'savingSpendingId',
      'savingSpendingCategoryId',
      'date',
      'actualDate',
    ],
    onValuesChange: debouncedSave,
    validate: (values) => ({
      date: isNotEmpty(t('form.errors.dateRequired'))(values.date),
      actualDate: validateActualDate(values.actualDate, values),
      cost: matches(costRegex, t('form.errors.invalidAmount'))(values.cost),
      ...(values.transactionType === 'fromSavings'
        ? {
            savingSpendingId: isNotEmpty(
              t('form.errors.savingSpendingRequired'),
            )(values.savingSpendingId),
            savingSpendingCategoryId: isNotEmpty(
              t('form.errors.savingSpendingCategoryRequired'),
            )(values.savingSpendingCategoryId),
          }
        : values.transactionType === 'income'
          ? {
              incomeCategory: isNotEmpty(t('form.errors.categoryRequired'))(
                values.incomeCategory,
              ),
            }
          : {
              expenseCategory: isNotEmpty(t('form.errors.categoryRequired'))(
                values.expenseCategory,
              ),
            }),
    }),
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

  const handleSubmit = form.onSubmit(
    async (prepared) => {
      if (!prepared) {
        return;
      }
      const tx = await saveTransaction(prepared);
      setInsertedTransaction(tx);
      form.reset();
      close();
    },
    (validationErrors) => {
      console.log(validationErrors);
    },
  );

  return (
    <form aria-label={t('form.ariaLabel')} onSubmit={handleSubmit}>
      <Stack gap="sm" pr={16}>
        <Stack gap="sm">
          <TransactionTypeField form={form} />
          <DatePickerWithTodayInput
            label={t('form.date')}
            required
            {...form.getInputProps('date')}
          />

          <ActualDateField form={form} />

          {form.values.transactionType === 'fromSavings' ? (
            <SavingSpendingFields
              form={form}
              initialSavingSpendingId={initialValues.savingSpendingId}
            />
          ) : (
            <>
              <CategoryFields form={form} />
              <SubscriptionField form={form} />
            </>
          )}

          <CostField form={form} />

          <TextInput
            label={t('form.comment')}
            {...form.getInputProps('name')}
          />

          <SourceField form={form} />
        </Stack>

        {editingId !== null && Object.keys(form.errors).length > 0 && (
          <Alert color="yellow" p="xs">
            {t('form.unsavedChanges')}
          </Alert>
        )}

        {editingId === null && (
          <Button type="submit" mt="sm" disabled={!form.isDirty()}>
            {t('form.add')}
          </Button>
        )}
      </Stack>
    </form>
  );
}
