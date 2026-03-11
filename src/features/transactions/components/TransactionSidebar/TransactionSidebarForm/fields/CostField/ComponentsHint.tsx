import { Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import Decimal from 'decimal.js';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getCategoryMapQueryOptions } from '~/features/categories/facets/categoryMap';
import { costToString } from '~/shared/utils/costToString';
import { decimalSum } from '~/shared/utils/decimalSum';
import { findByIdOrThrow, getOrThrow } from '~/shared/utils/getOrThrow';

import type { TransactionComponentData } from '../../transactionFormValues';

interface Props {
  cost: Decimal;
  components: TransactionComponentData[];
}

function useComponentCategoryLabel() {
  const { data: categoryMap = {} } = useQuery(getCategoryMapQueryOptions());

  return useCallback(
    (component: TransactionComponentData): string => {
      const category = getOrThrow(
        categoryMap,
        component.categoryId,
        'Category',
      );
      if (component.subcategoryId !== null) {
        const sub = findByIdOrThrow(
          category.subcategories,
          component.subcategoryId,
          'Subcategory',
        );
        return `${category.name} - ${sub.name}`;
      }
      return category.name;
    },
    [categoryMap],
  );
}

export function ComponentsHint({ cost, components }: Props) {
  const { t } = useTranslation('transactions');
  const getCategoryLabel = useComponentCategoryLabel();

  const { data: categoryMap } = useQuery(getCategoryMapQueryOptions());

  const componentLabels = useMemo(() => {
    if (!categoryMap) {
      return [];
    }
    return components.map((c) => ({
      cost: new Decimal(c.cost),
      category: getCategoryLabel(c),
    }));
  }, [categoryMap, components, getCategoryLabel]);

  if (components.length === 0) {
    return null;
  }

  if (components.length === 1 && componentLabels[0]) {
    return (
      <Text size="xs" c="dimmed">
        {t('components.hint.ofWhich', {
          cost: costToString(componentLabels[0].cost),
          category: componentLabels[0].category,
        })}
      </Text>
    );
  }

  const remainder = cost
    .abs()
    .minus(decimalSum(...componentLabels.map((c) => c.cost)));

  return (
    <Text size="xs" c="dimmed">
      {t('components.hint.ofWhichMultiple')}
      <ul style={{ margin: '2px 0 0', paddingLeft: '1.2em' }}>
        {componentLabels.map((item, i) => (
          <li key={i}>
            {t('components.hint.item', {
              cost: costToString(item.cost),
              category: item.category,
            })}
          </li>
        ))}
      </ul>
      {t('components.hint.remainder', { value: costToString(remainder) })}
    </Text>
  );
}
