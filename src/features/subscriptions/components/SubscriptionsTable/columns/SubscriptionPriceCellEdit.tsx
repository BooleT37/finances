import { useQuery } from '@tanstack/react-query';
import { useMolecule } from 'bunshi/react';
import Decimal from 'decimal.js';
import { useSetAtom } from 'jotai';
import type { MRT_TableInstance } from 'mantine-react-table-open';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { getCategoryMapQueryOptions } from '~/features/categories/facets/categoryMap';
import { EditableCellInput } from '~/shared/components/EditableCellInput';
import { adaptCost } from '~/shared/utils/adaptCost';
import { getOrThrow } from '~/shared/utils/getOrThrow';
import { costRegex } from '~/shared/utils/table/validation';

import type { Subscription } from '../../../schema';
import { SubscriptionInlineEditMolecule } from '../subscriptionInlineEditMolecule';

interface SubscriptionPriceCellEditProps {
  row: Subscription;
  table: MRT_TableInstance<Subscription>;
}

export function SubscriptionPriceCellEdit({
  row,
  table,
}: SubscriptionPriceCellEditProps) {
  const { t } = useTranslation('subscriptions');
  const { data: categoryMap } = useQuery(getCategoryMapQueryOptions());
  const { updateInlineSubscriptionFieldAtom } = useMolecule(
    SubscriptionInlineEditMolecule,
  );
  const updateInlineSubscriptionField = useSetAtom(
    updateInlineSubscriptionFieldAtom,
  );

  const handleSave = useCallback(
    (value: string) => {
      if (!categoryMap) {
        return Promise.resolve(undefined);
      }
      const category = getOrThrow(categoryMap, row.categoryId, 'Category');
      const newCost = adaptCost(new Decimal(value).abs(), category.isIncome);
      // The global error notification middleware already surfaces failures.
      return updateInlineSubscriptionField(row, {
        field: 'cost',
        value: newCost,
      }).catch(() => {});
    },
    [categoryMap, row, updateInlineSubscriptionField],
  );

  return (
    <EditableCellInput
      aria-label={t('columns.price')}
      initialValue={row.cost.abs().toFixed(2)}
      isValid={(value) => costRegex.test(value)}
      onClose={() => table.setEditingCell(null)}
      onSave={handleSave}
    />
  );
}
