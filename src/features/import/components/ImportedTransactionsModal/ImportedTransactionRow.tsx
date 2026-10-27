import { Checkbox, Group, TextInput, Tooltip } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import type { UseFormReturnType } from '@mantine/form';
import { IconSparkles } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

import type { CategorySuggestion } from '~/features/import/categorySuggestions/categorySuggestion';
import type { ImportedTransactionCategoryValue } from '~/features/import/importedTransactionCategoryValue';
import { TreeSelect } from '~/shared/components/TreeSelect';
import { ISO_DATE_FORMAT } from '~/shared/constants';

import { useImportedTransactionCategoryTree } from './importedTransactionCategoryTree';
import type { ImportedTransactionFormValues } from './ImportedTransactionsModal';

interface Props {
  index: number;
  form: UseFormReturnType<ImportedTransactionFormValues>;
  categorySuggestion: CategorySuggestion | null;
  categorySuggestionLoading: boolean;
}

const isNegativeAmount = (amount: string) => {
  const parsed = parseFloat(amount);
  return !isNaN(parsed) && parsed < 0;
};

export function ImportedTransactionRow({
  index,
  form,
  categorySuggestion,
  categorySuggestionLoading,
}: Props) {
  const { t } = useTranslation('import');
  const row = form.values.expenses[index];
  const selected = row?.selected ?? false;
  const amountIsNegative = isNegativeAmount(row?.amount ?? '');

  const categoryTreeData = useImportedTransactionCategoryTree({
    isIncome: !amountIsNegative,
  });

  if (!row) {
    return null;
  }

  const isSuggested =
    categorySuggestion !== null &&
    row.categorySubcategoryId === categorySuggestion.value;

  const getInputProps = (field: string) =>
    form.getInputProps(`expenses.${index}.${field}`);

  const amountInputProps = getInputProps('amount');
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isNegativeAmount(e.currentTarget.value) !== amountIsNegative) {
      form.setFieldValue(`expenses.${index}.categorySubcategoryId`, null);
    }
    amountInputProps.onChange(e);
  };

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

      <TextInput
        size="xs"
        disabled={!selected}
        {...amountInputProps}
        onChange={handleAmountChange}
      />

      <Group gap={4} wrap="nowrap" align="flex-start">
        <div style={{ flex: 1, minWidth: 0 }}>
          <TreeSelect<ImportedTransactionCategoryValue>
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
            loading={categorySuggestionLoading}
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
