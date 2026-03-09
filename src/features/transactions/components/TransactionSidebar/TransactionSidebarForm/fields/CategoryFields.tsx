import { Select } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  getExpenseCategoriesQueryOptions,
  getIncomeCategoriesQueryOptions,
} from '~/features/categories/facets/categoriesByType';
import { getCategoryMapQueryOptions } from '~/features/categories/facets/categoryMap';
import { getOrThrow } from '~/shared/utils/getOrThrow';

import type { TransactionFormValues } from '../transactionFormValues';

interface Props {
  form: UseFormReturnType<TransactionFormValues>;
}

export function CategoryFields({ form }: Props) {
  const { t } = useTranslation('transactions');

  const { data: categoryMap = {} } = useQuery(getCategoryMapQueryOptions());
  const { data: expenseCategories = [] } = useQuery(
    getExpenseCategoriesQueryOptions(),
  );
  const { data: incomeCategories = [] } = useQuery(
    getIncomeCategoriesQueryOptions(),
  );

  const categories =
    form.values.transactionType === 'income'
      ? incomeCategories
      : expenseCategories.filter((c) => c.type !== 'FROM_SAVINGS');

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

  return (
    <>
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
    </>
  );
}
