import { useForm } from '@mantine/form';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import type { CategorySuggestion } from '~/features/transactions/categorySuggestions/categorySuggestion';
import type { ParsedExpenseCategoryValue } from '~/features/transactions/parsedExpenseCategoryValue';
import { act, renderHook } from '~/test/render';

import type {
  ParsedExpenseFormValues,
  ParsedExpenseRowValues,
} from './ParsedExpensesModal';
import { usePrefillCategorySuggestions } from './usePrefillCategorySuggestions';

const row = (
  categorySubcategoryId: ParsedExpenseCategoryValue | null,
): ParsedExpenseRowValues => ({
  selected: true,
  date: dayjs('2026-09-30'),
  type: 'Card transaction',
  description: 'REWE Markt GmbH-Zw, Berlin, DE Card *6213',
  amount: '-41.20',
  categorySubcategoryId,
  hash: 'hash',
  importedDescription: 'REWE Markt GmbH-Zw, Berlin, DE Card *6213',
});

const suggestion = (value: ParsedExpenseCategoryValue): CategorySuggestion => ({
  value,
  confidence: 0.9,
  similarCount: 3,
});

interface PrefillProps {
  categorySuggestions: (CategorySuggestion | null)[] | undefined;
}

const renderPrefill = (rows: ParsedExpenseRowValues[]) => {
  const initialProps: PrefillProps = { categorySuggestions: undefined };
  return renderHook(
    ({ categorySuggestions }: PrefillProps) => {
      const form = useForm<ParsedExpenseFormValues>({
        initialValues: { expenses: rows },
      });
      usePrefillCategorySuggestions(form, categorySuggestions);
      return form;
    },
    { initialProps },
  );
};

const categoryOf = (
  form: ReturnType<typeof renderPrefill>['result']['current'],
  index: number,
) => form.getValues().expenses[index]?.categorySubcategoryId;

describe('usePrefillCategorySuggestions', () => {
  it('fills only the rows that got a category suggestion', () => {
    const { result, rerender } = renderPrefill([row(null), row(null)]);

    rerender({ categorySuggestions: [suggestion('1'), null] });

    expect(categoryOf(result.current, 0)).toBe('1');
    expect(categoryOf(result.current, 1)).toBeNull();
  });

  it('keeps a category the user has already picked', () => {
    const { result, rerender } = renderPrefill([row('2')]);

    rerender({ categorySuggestions: [suggestion('1')] });

    expect(categoryOf(result.current, 0)).toBe('2');
  });

  it('leaves a field the user cleared after the fill empty', () => {
    const { result, rerender } = renderPrefill([row(null)]);
    const categorySuggestions = [suggestion('1')];
    rerender({ categorySuggestions });

    act(() => {
      result.current.setFieldValue('expenses.0.categorySubcategoryId', null);
    });
    rerender({ categorySuggestions });

    expect(categoryOf(result.current, 0)).toBeNull();
  });
});
