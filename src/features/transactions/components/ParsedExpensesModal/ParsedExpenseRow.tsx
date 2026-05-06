import { Checkbox, TextInput } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import type { UseFormReturnType } from '@mantine/form';
import dayjs from 'dayjs';
import { useEffect } from 'react';

import {
  type CategorySubcategoryId,
  parseCategorySubcategoryId,
} from '~/features/categories/categorySubcategoryId';
import { useCategoryTreeData } from '~/features/categories/facets/categoryTreeData';
import { TreeSelect } from '~/shared/components/TreeSelect';

import type { ParsedExpenseFormValues } from './ParsedExpensesModal';

interface Props {
  index: number;
  form: UseFormReturnType<ParsedExpenseFormValues>;
}

export function ParsedExpenseRow({ index, form }: Props) {
  const row = form.values.expenses[index];
  const amount = row?.amount ?? '';
  const selected = row?.selected ?? false;
  const parsedAmount = parseFloat(amount);
  const amountIsNegative = !isNaN(parsedAmount) && parsedAmount < 0;

  const categoryTreeData = useCategoryTreeData({ isIncome: !amountIsNegative });

  useEffect(() => {
    if (!row) {
      return;
    }
    form.setFieldValue(`expenses.${index}.categorySubcategoryId`, null);
    // reset category when amount sign changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountIsNegative]);

  if (!row) {
    return null;
  }

  const getInputProps = (field: string) =>
    form.getInputProps(`expenses.${index}.${field}`);

  return (
    <div style={{ display: 'contents' }} data-expense-row={index}>
      <Checkbox
        style={{ marginTop: 5 }}
        checked={selected}
        onChange={(e) =>
          form.setFieldValue(
            `expenses.${index}.selected`,
            e.currentTarget.checked,
          )
        }
      />

      <DatePickerInput
        size="xs"
        valueFormat="DD.MM.YYYY"
        disabled={!selected}
        value={row.date?.toDate() ?? null}
        onChange={(val) =>
          form.setFieldValue(`expenses.${index}.date`, val ? dayjs(val) : null)
        }
        error={getInputProps('date').error}
      />

      <TextInput
        size="xs"
        disabled
        variant="unstyled"
        value={row.type}
        styles={{ input: { paddingInline: 'var(--mantine-spacing-xs)' } }}
      />

      <TextInput
        size="xs"
        disabled={!selected}
        {...getInputProps('description')}
      />

      <TextInput size="xs" disabled={!selected} {...getInputProps('amount')} />

      <TreeSelect
        treeData={categoryTreeData ?? []}
        value={row.categorySubcategoryId as CategorySubcategoryId | null}
        onChange={(val) => {
          if (val) {
            parseCategorySubcategoryId(val as CategorySubcategoryId);
          }
          form.setFieldValue(`expenses.${index}.categorySubcategoryId`, val);
        }}
        error={getInputProps('categorySubcategoryId').error}
        disabled={!selected}
      />
    </div>
  );
}
