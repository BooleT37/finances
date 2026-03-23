import { Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { costToString } from '~/shared/utils/costToString';

import type { CostCol } from '../../TransactionsTable.types';
import { CostCellView } from './CostCellView';
import { CostWithDiffCellView } from './CostWithDiffCellView';
import { useCostAggregatedCell } from './useCostAggregatedCell';

interface CostAggregatedCellRendererProps {
  value: CostCol | null;
  isIncome: boolean;
  isContinuous: boolean;
  isSubcategoryRow: boolean;
  categoryId: number | undefined;
  subcategoryId: number | undefined;
}

export function CostAggregatedCellRenderer({
  value: col,
  isSubcategoryRow,
  categoryId,
  subcategoryId,
  isIncome,
  isContinuous,
}: CostAggregatedCellRendererProps) {
  const { t } = useTranslation('transactions');
  const result = useCostAggregatedCell({
    col,
    isIncome,
    isContinuous,
    isSubcategoryRow,
    categoryId,
    subcategoryId,
  });

  if (!result) {
    return null;
  }

  if (!result.hasDiff) {
    return (
      <CostCellView
        cost={result.costString}
        isSubscription={result.isSubscription}
        isUpcomingSubscription={result.isUpcomingSubscription}
      />
    );
  }

  return (
    <CostWithDiffCellView
      cost={result.costString}
      suffix={result.diffString}
      color={result.color}
      barOffset={result.barOffset}
      barWidth={result.barWidth}
      tooltip={
        result.exceedAmount !== undefined ? (
          <Stack gap={0}>
            <div>{result.tooltip}</div>
            <div>
              {t('forecast.exceededBy', {
                value: costToString(result.exceedAmount),
              })}
            </div>
          </Stack>
        ) : (
          result.tooltip
        )
      }
    />
  );
}
