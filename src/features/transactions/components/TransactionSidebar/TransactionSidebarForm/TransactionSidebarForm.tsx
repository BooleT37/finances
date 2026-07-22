import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Group,
  Stack,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { isNotEmpty, matches, useForm } from '@mantine/form';
import { useDebouncedCallback } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { IconRepeat } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useMolecule } from 'bunshi/react';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  buildCategorySubcategoryId,
  parseCategorySubcategoryId,
} from '~/features/categories/categorySubcategoryId';
import { getFromSavingsCategoryQueryOptions } from '~/features/categories/facets/categoriesByType';
import { DatePickerWithTodayInput } from '~/shared/components/DatePickerWithTodayInput';

import { TransactionSidebarMolecule } from '../transactionSidebarMolecule';
import { CreateSubscriptionModal } from './CreateSubscriptionModal';
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
  TransformedTransactionFormValues,
  ValidatedTransactionFormValues,
} from './transactionFormValues';
import { emptyTransactionFormValuesAtom } from './TransactionSidebarForm.atoms';
import { useTransactionToFormValues } from './transactionToFormValues';
import { useFlashOnGroupChange } from './useFlashOnGroupChange';

const costRegex = /^-?\d+(?:\.\d+)?$/;

export function TransactionSidebarForm() {
  const {
    editingIdAtom,
    currentTransactionAtom,
    formRefAtom,
    saveTransactionAtom,
    refreshActualDateShownAtom,
    closeAtom,
  } = useMolecule(TransactionSidebarMolecule);

  const editingId = useAtomValue(editingIdAtom);
  const currentTransaction = useAtomValue(currentTransactionAtom);
  const saveTransaction = useSetAtom(saveTransactionAtom);
  const refreshActualDateShown = useSetAtom(refreshActualDateShownAtom);
  const close = useSetAtom(closeAtom);
  const flashOnGroupChange = useFlashOnGroupChange();
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
  const emptyTransactionFormValues = useAtomValue(
    emptyTransactionFormValuesAtom,
  );

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
    const previous = currentTransaction;
    const updatedTx = await saveTransaction(prepared);
    f.resetDirty();
    flashOnGroupChange(previous, updatedTx);
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

  const form = useForm<
    TransactionFormValues,
    TransformedTransactionFormValues | null
  >({
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

  const handleCreateSubscription = useCallback(() => {
    const {
      transactionType,
      expenseCategory,
      expenseSubcategory,
      incomeCategory,
      incomeSubcategory,
      source,
      cost,
      name,
      date,
    } = form.values;
    const activeCategory =
      transactionType === 'income' ? incomeCategory : expenseCategory;
    const activeSubcategory =
      transactionType === 'income' ? incomeSubcategory : expenseSubcategory;

    modals.open({
      title: t('form.createSubscriptionModalTitle'),
      children: (
        <CreateSubscriptionModal
          initialValues={{
            name,
            cost: cost.replace(/^-/, ''),
            period: '1',
            categoryId:
              activeCategory !== null
                ? buildCategorySubcategoryId({
                    categoryId: Number(activeCategory),
                    subcategoryId:
                      activeSubcategory !== null
                        ? Number(activeSubcategory)
                        : null,
                  })
                : null,
            firstDate: date,
            sourceId: source,
          }}
          onSuccess={({ subscriptionId, categoryId, sourceId, name }) => {
            form.setFieldValue('subscription', String(subscriptionId));
            if (name && !form.values.name) {
              form.setFieldValue('name', name);
            }
            if (sourceId !== null && form.values.source === null) {
              form.setFieldValue('source', sourceId);
            }
            if (categoryId !== null) {
              const { categoryId: catId, subcategoryId } =
                parseCategorySubcategoryId(categoryId);
              if (form.values.transactionType === 'income') {
                if (!form.values.incomeCategory) {
                  form.setFieldValue('incomeCategory', String(catId));
                  form.setFieldValue(
                    'incomeSubcategory',
                    subcategoryId !== null ? String(subcategoryId) : null,
                  );
                }
              } else {
                if (!form.values.expenseCategory) {
                  form.setFieldValue('expenseCategory', String(catId));
                  form.setFieldValue(
                    'expenseSubcategory',
                    subcategoryId !== null ? String(subcategoryId) : null,
                  );
                }
              }
            }
          }}
        />
      ),
    });
  }, [form, t]);

  const handleSubmit = form.onSubmit(
    async (prepared) => {
      if (!prepared) {
        return;
      }
      const wasAdding = editingId === null;
      const tx = await saveTransaction(prepared);
      flashOnGroupChange(null, tx);
      form.reset();
      if (wasAdding) {
        close();
      } else {
        refreshActualDateShown(tx.id);
      }
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

          <Group gap="xs" align="flex-end" wrap="nowrap">
            <Box style={{ flex: 1 }}>
              <CostField form={form} />
            </Box>
            {form.values.transactionType !== 'fromSavings' &&
              form.values.subscription === null && (
                <Tooltip label={t('form.createSubscription')}>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    aria-label={t('form.createSubscription')}
                    onClick={handleCreateSubscription}
                    mb={4}
                  >
                    <IconRepeat size={16} />
                  </ActionIcon>
                </Tooltip>
              )}
          </Group>

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
