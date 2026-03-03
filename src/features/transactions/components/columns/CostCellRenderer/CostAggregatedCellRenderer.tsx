import { Stack } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import Decimal from 'decimal.js';
import { useTranslation } from 'react-i18next';

import { getCategoryMapQueryOptions } from '~/features/categories/facets/categoryMap';
import { costToDiffString, costToString } from '~/shared/utils/costToString';
import { divideWithFallbackToOne } from '~/shared/utils/divideWithFallbackToOne';

import type { CostCol } from '../../../transactionTableItem';
import { CostCellView } from './CostCellView';
import { useGetCostForecast } from './getCostForecast';
import { TotalCostCellView } from './TotalCostCellView';

interface CostAggregatedCellRendererProps {
  value: CostCol | null;
  isIncome: boolean;
  isContinuous: boolean;
  passedDaysRatio: number | null;
  isSubcategoryRow: boolean;
  categoryId: number | undefined;
  subcategoryId: number | undefined;
  isRangePicker: boolean;
  month: number;
  year: number;
}

export function CostAggregatedCellRenderer({
  value: col,
  passedDaysRatio,
  isSubcategoryRow,
  categoryId,
  subcategoryId,
  isIncome,
  isRangePicker,
  isContinuous,
  month,
  year,
}: CostAggregatedCellRendererProps) {
  const { t } = useTranslation('transactions');
  const getCostForecast = useGetCostForecast();
  const { data: categoryMap } = useQuery(getCategoryMapQueryOptions());

  if (!col) {
    return null;
  }

  const { value } = col;
  const costString = costToString(value);

  if (isRangePicker) {
    return (
      <CostCellView
        cost={costString}
        isSubscription={col.isSubscription}
        isUpcomingSubscription={col.isUpcomingSubscription}
      />
    );
  }

  const categoryType =
    categoryId !== undefined ? (categoryMap?.[categoryId]?.type ?? null) : null;

  const forecast =
    getCostForecast({
      categoryId,
      categoryType,
      isSubcategoryRow,
      subcategoryId,
      month,
      year,
      isIncome,
    }) ?? new Decimal(0);

  const forecastNumber = forecast.toNumber();
  const diff = value.minus(forecast);
  const diffNumber = diff.toNumber();
  const valueNumber = value.toNumber();
  const color = diff.isNeg() ? 'red' : 'green';
  const tooltip = t('forecast.plan', { value: costToString(forecast) });

  if (value.abs().lessThanOrEqualTo(forecast.abs())) {
    const spentRatio = divideWithFallbackToOne(valueNumber, forecastNumber);
    const exceedingForecast =
      isContinuous && passedDaysRatio !== null && spentRatio > passedDaysRatio;

    if (exceedingForecast) {
      return (
        <TotalCostCellView
          cost={costString}
          suffix={costToDiffString(diff)}
          color="orange"
          barWidth={spentRatio}
          tooltip={
            <Stack gap={0}>
              <div>{tooltip}</div>
              <div>
                {t('forecast.exceededBy', {
                  value: costToString(
                    Math.abs(valueNumber - passedDaysRatio * forecastNumber),
                  ),
                })}
              </div>
            </Stack>
          }
        />
      );
    }

    return (
      <TotalCostCellView
        cost={costString}
        suffix={costToDiffString(diff)}
        color={color}
        barWidth={spentRatio}
        tooltip={tooltip}
      />
    );
  }

  return (
    <TotalCostCellView
      cost={costString}
      suffix={costToDiffString(diff)}
      color={diff.isNeg() ? 'red' : 'green'}
      barOffset={forecastNumber / valueNumber}
      barWidth={diffNumber / valueNumber}
      tooltip={tooltip}
    />
  );
}
