import { Select } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getCategoryMapQueryOptions } from '~/features/categories/facets/categoryMap';
import { useExpenseCategories } from '~/features/categories/facets/expenseCategories';
import { useIncomeCategories } from '~/features/categories/facets/incomeCategories';
import { getOrThrow } from '~/shared/utils/getOrThrow';

import type { TransactionFormType } from '../transactionFormValues';

interface Props {
  form: TransactionFormType;
}

export function CategoryFields({ form }: Props) {
  const { t } = useTranslation('transactions');

  const { data: categoryMap = {} } = useQuery(getCategoryMapQueryOptions());
  const expenseCategories = useExpenseCategories();
  const incomeCategories = useIncomeCategories();

  const isIncome = form.values.transactionType === 'income';
  const categoryField = isIncome ? 'incomeCategory' : 'expenseCategory';
  const subcategoryField = isIncome
    ? 'incomeSubcategory'
    : 'expenseSubcategory';

  const categoryOptions = useMemo(() => {
    const categories = isIncome
      ? (incomeCategories ?? [])
      : (expenseCategories ?? []).filter((c) => c.type !== 'FROM_SAVINGS');
    return categories.map((c) => ({ value: String(c.id), label: c.name }));
  }, [isIncome, expenseCategories, incomeCategories]);

  const selectedCategory = useMemo(() => {
    const value = form.values[categoryField];
    if (value === null) {
      return undefined;
    }
    return getOrThrow(categoryMap, Number(value), 'Category');
  }, [categoryMap, categoryField, form.values]);

  const subcategoryOptions = useMemo(
    () =>
      selectedCategory?.subcategories.map((s) => ({
        value: String(s.id),
        label: s.name,
      })) ?? [],
    [selectedCategory],
  );

  return (
    <>
      <Select
        label={t('form.category')}
        required
        data={categoryOptions}
        {...form.getInputProps(categoryField)}
        onChange={(v) => {
          form.setFieldValue(categoryField, v);
          form.setFieldValue(subcategoryField, null);
        }}
        searchable
      />
      {subcategoryOptions.length > 0 && (
        <Select
          label={t('form.subcategory')}
          data={subcategoryOptions}
          {...form.getInputProps(subcategoryField)}
          clearable
        />
      )}
    </>
  );
}
