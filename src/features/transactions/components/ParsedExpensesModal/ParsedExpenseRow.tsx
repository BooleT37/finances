import { Checkbox, Group, TextInput, Tooltip } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import type { UseFormReturnType } from '@mantine/form';
import { IconSparkles } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import type { CategorySuggestion } from '~/features/transactions/categorySuggestions/categorySuggestion';
import type { ParsedExpenseCategoryValue } from '~/features/transactions/parsedExpenseCategoryValue';
import { TreeSelect } from '~/shared/components/TreeSelect';
import { ISO_DATE_FORMAT } from '~/shared/constants';

import { useParsedExpenseCategoryTree } from './parsedExpenseCategoryTree';
import type { ParsedExpenseFormValues } from './ParsedExpensesModal';

interface Props {
  index: number;
  form: UseFormReturnType<ParsedExpenseFormValues>;
  categorySuggestion: CategorySuggestion | null;
  categorySuggestionLoading: boolean;
}

export function ParsedExpenseRow({
  index,
  form,
  categorySuggestion,
  categorySuggestionLoading,
}: Props) {
  const { t } = useTranslation('transactions');
  const row = form.values.expenses[index];
  const amount = row?.amount ?? '';
  const selected = row?.selected ?? false;
  const parsedAmount = parseFloat(amount);
  const amountIsNegative = !isNaN(parsedAmount) && parsedAmount < 0;

  const categoryTreeData = useParsedExpenseCategoryTree({
    isIncome: !amountIsNegative,
  });

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

  const isSuggested =
    categorySuggestion !== null &&
    row.categorySubcategoryId === categorySuggestion.value;

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
        value={row.date?.format(ISO_DATE_FORMAT) ?? null}
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

      <Group gap={4} wrap="nowrap" align="flex-start">
        <div style={{ flex: 1, minWidth: 0 }}>
          <TreeSelect<ParsedExpenseCategoryValue>
            treeData={categoryTreeData ?? []}
            value={row.categorySubcategoryId}
            onChange={(val) => {
              form.setFieldValue(
                `expenses.${index}.categorySubcategoryId`,
                val,
              );
            }}
            error={getInputProps('categorySubcategoryId').error}
            placeholder={
              categorySuggestionLoading
                ? t('importModal.suggestingCategory')
                : undefined
            }
            disabled={!selected}
            selectionProp="selectionTitle"
            searchProp="searchValue"
          />
        </div>
        <div style={{ width: 16, flexShrink: 0, paddingTop: 6 }}>
          {isSuggested && (
            <Tooltip
              multiline
              w={260}
              label={
                <>
                  {t('importModal.suggestedCategory', {
                    confidence: Math.round(categorySuggestion.confidence * 100),
                  })}
                  <br />
                  {t('importModal.suggestedCategorySimilar', {
                    count: categorySuggestion.similarCount,
                  })}
                </>
              }
            >
              <IconSparkles
                size={16}
                color="var(--mantine-color-yellow-6)"
                aria-label={t('importModal.suggestedCategoryLabel')}
              />
            </Tooltip>
          )}
        </div>
      </Group>
    </div>
  );
}
