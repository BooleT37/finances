import { Stack } from '@mantine/core';
import { Decimal } from 'decimal.js';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

import { costToDiffString, costToString } from '~/shared/utils/costToString';
import {
  selectedMonth0BasedAtom,
  selectedYearAtom,
  viewModeAtom,
} from '~/stores/month';

import type { CostColValue } from '../../TransactionsTable.types';
import { CostCellView } from './CostCellView';
import { CostWithDiffCellView } from './CostWithDiffCellView';
import { getCostAggregatedCell } from './getCostAggregatedCell';
import {
  type GetCostForecastParams,
  useGetCostForecast,
} from './getCostForecast';

interface Props extends GetCostForecastParams {
  value: CostColValue | null;
  isContinuous: boolean;
}

export function CostAggregatedCellRenderer({
  value,
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

  const isYearMode = useAtomValue(viewModeAtom) === 'year';
  const year = useAtomValue(selectedYearAtom);
  const month = useAtomValue(selectedMonth0BasedAtom);

  if (!value) {
    return null;
  }

  const costString = costToString(value.cost);

  if (isYearMode) {
    return <CostCellView cost={costString} />;
  }

  const result = getCostAggregatedCell({
    value,
    isContinuous,
    forecast,
    month,
    year,
  });

  return (
    <CostWithDiffCellView
      cost={costString}
      suffix={costToDiffString(result.diff)}
      color={result.color}
      barOffset={result.barOffset}
      barLength={result.barLength}
      tooltip={
        result.exceedingAmount !== undefined ? (
          <Stack gap={0}>
            <div>{t('forecast.plan', { value: costToString(forecast) })}</div>
            <div>
              {t('forecast.exceededBy', {
                value: costToString(result.exceedingAmount),
              })}
            </div>
          </Stack>
        ) : (
          t('forecast.plan', { value: costToString(forecast) })
        )
      }
    />
  );
}
