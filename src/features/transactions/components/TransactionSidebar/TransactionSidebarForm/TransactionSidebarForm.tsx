import { Button, Stack, TextInput } from '@mantine/core';
import { isNotEmpty, matches, useForm } from '@mantine/form';
import { useQuery } from '@tanstack/react-query';
import { useMolecule } from 'bunshi/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getFromSavingsCategoryQueryOptions } from '~/features/categories/facets/categoriesByType';
import { DatePickerWithTodayInput } from '~/shared/components/DatePickerWithTodayInput';

import { insertedTransactionAtom } from '../../TransactionsTable/flashTransaction';
import { TransactionSidebarMolecule } from '../transactionSidebarMolecule';
import { ActualDateField } from './fields/ActualDateField';
import { useActualDateValidator } from './fields/ActualDateField.validator';
import { CategoryFields } from './fields/CategoryFields';
import { SavingSpendingFields } from './fields/SavingSpendingFields';
import { SourceField } from './fields/SourceField/SourceField';
import { SubscriptionField } from './fields/SubscriptionField';
import { TransactionTypeField } from './fields/TransactionTypeField';
import type {
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
    insertTransactionAtom,
    closeAtom,
  } = useMolecule(TransactionSidebarMolecule);

  const editingId = useAtomValue(editingIdAtom);
  const currentTransaction = useAtomValue(currentTransactionAtom);
  const insertTransaction = useSetAtom(insertTransactionAtom);
  const close = useSetAtom(closeAtom);
  const setInsertedTransaction = useSetAtom(insertedTransactionAtom);
  const setFormRef = useSetAtom(formRefAtom);

  const { data: fromSavingsCategory } = useQuery(
    getFromSavingsCategoryQueryOptions(),
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

  const form = useForm<TransactionFormValues>({
    initialValues,
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
        : {
            category: isNotEmpty(t('form.errors.categoryRequired'))(
              values.category,
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

  // When editing a fromSavings transaction, re-apply savingSpendingId once maps load
  // (handles the case where maps weren't cached at initialValues time)
  useEffect(() => {
    if (!currentTransaction) {
      return;
    }
    const values = transactionToFormValues(currentTransaction);
    if (values.savingSpendingId !== null) {
      form.setFieldValue('savingSpendingId', values.savingSpendingId);
    }
    // form intentionally omitted from deps (stable ref, matches pattern in this file)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTransaction, transactionToFormValues]);

  const handleSubmit = form.onSubmit(
    async (values) => {
      const submittedValues: ValidatedTransactionFormValues = {
        ...(values as ValidatedTransactionFormValues),
      };
      if (values.transactionType === 'fromSavings') {
        if (!fromSavingsCategory) {
          return;
        }
        submittedValues.category = String(fromSavingsCategory.id);
        submittedValues.subscription = null;
      } else {
        submittedValues.savingSpendingCategoryId = null;
      }
      const tx = await insertTransaction(submittedValues);
      setInsertedTransaction(tx);
      form.reset();
      close();
    },
    (validationErrors) => {
      console.log(validationErrors);
    },
  );

  return (
    <form onSubmit={handleSubmit}>
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

        <TextInput
          label={t('form.amount')}
          required
          {...form.getInputProps('cost')}
        />

        <TextInput label={t('form.comment')} {...form.getInputProps('name')} />

        <SourceField form={form} />

        <Button type="submit" mt="sm" /* disabled={!form.isDirty()} */>
          {editingId === null ? t('form.add') : t('form.save')}
        </Button>
      </Stack>
    </form>
  );
}
