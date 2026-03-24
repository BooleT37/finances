import { Stack } from '@mantine/core';
import { Decimal } from 'decimal.js';
import { useTranslation } from 'react-i18next';

import { costToString } from '~/shared/utils/costToString';

import type { CostCol } from '../../TransactionsTable.types';
import { CostCellView } from './CostCellView';
import { CostWithDiffCellView } from './CostWithDiffCellView';
import {
  type GetCostForecastParams,
  useGetCostForecast,
} from './getCostForecast';
import { useCostAggregatedCell } from './useCostAggregatedCell';

interface Props extends GetCostForecastParams {
  value: CostCol | null;
  isContinuous: boolean;
}

export function CostAggregatedCellRenderer({
  value: col,
  isRestRow,
  categoryId,
  subcategoryId,
  isIncome,
  isContinuous,
}: Props) {
  const { t } = useTranslation('transactions');

  const getCostForecast = useGetCostForecast();
  const forecast =
    getCostForecast({
      categoryId,
      isRestRow,
      subcategoryId,
      isIncome,
    }) ?? new Decimal(0);

  const result = useCostAggregatedCell({
    col,
    isContinuous,
    forecast,
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
