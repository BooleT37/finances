import dayjs from 'dayjs';
import Decimal from 'decimal.js';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

import { costToDiffString, costToString } from '~/shared/utils/costToString';
import { divideWithFallbackToOne } from '~/shared/utils/divideWithFallbackToOne';
import { getToday } from '~/shared/utils/today';
import {
  selectedMonth0BasedAtom,
  selectedYearAtom,
  viewModeAtom,
} from '~/stores/month';

import type { CostCol } from '../../TransactionsTable.types';

export type GetCostAggregatedCellResult =
  | {
      hasDiff: false;
      passedDaysRatio: null;
      costString: string;
      isSubscription: boolean;
      isUpcomingSubscription: boolean;
    }
  | {
      hasDiff: true;
      passedDaysRatio: number | null;
      costString: string;
      diffString: string;
      color: 'green' | 'red' | 'orange';
      barWidth: number;
      barOffset?: number;
      tooltip: string;
      exceedAmount?: number;
    };

interface GetCostAggregatedCellParams {
  col: CostCol;
  isContinuous: boolean;
  forecast: Decimal;
  isYearMode: boolean;
  month: number;
  year: number;
  tooltipPlanString: string;
}

export function getCostAggregatedCell({
  col,
  isContinuous,
  forecast,
  isYearMode,
  month,
  year,
  tooltipPlanString,
}: GetCostAggregatedCellParams): GetCostAggregatedCellResult {
  // getToday() is called at invocation time (not module load), so vi.setSystemTime() can mock it in tests
  const today = getToday();
  const isCurrentMonth = today.month() === month && today.year() === year;
  const daysInMonth = dayjs(new Date(year, month)).daysInMonth();

  const { value } = col;
  const costString = costToString(value);

  if (isYearMode) {
    return {
      hasDiff: false,
      passedDaysRatio: null,
      costString,
      isSubscription: col.isSubscription ?? false,
      isUpcomingSubscription: col.isUpcomingSubscription ?? false,
    };
  }

  const passedDaysRatio = isCurrentMonth ? today.date() / daysInMonth : 1;

  const forecastNumber = forecast.toNumber();
  const diff = value.minus(forecast);
  const diffNumber = diff.toNumber();
  const valueNumber = value.toNumber();
  const color: 'green' | 'red' = diff.isNeg() ? 'red' : 'green';

  if (value.abs().lessThanOrEqualTo(forecast.abs())) {
    const spentRatio = divideWithFallbackToOne(valueNumber, forecastNumber);
    const exceedingForecast =
      isContinuous && passedDaysRatio !== null && spentRatio > passedDaysRatio;

    if (exceedingForecast) {
      return {
        hasDiff: true,
        passedDaysRatio,
        costString,
        diffString: costToDiffString(diff),
        color: 'orange',
        barWidth: spentRatio,
        tooltip: tooltipPlanString,
        exceedAmount: Math.abs(valueNumber - passedDaysRatio * forecastNumber),
      };
    }

    return {
      hasDiff: true,
      passedDaysRatio,
      costString,
      diffString: costToDiffString(diff),
      color,
      barWidth: spentRatio,
      tooltip: tooltipPlanString,
    };
  }

  return {
    hasDiff: true,
    passedDaysRatio,
    costString,
    diffString: costToDiffString(diff),
    color,
    barOffset: forecastNumber / valueNumber,
    barWidth: diffNumber / valueNumber,
    tooltip: tooltipPlanString,
  };
}

interface Params {
  col: CostCol | null;
  isContinuous: boolean;
  forecast: Decimal;
}

export function useCostAggregatedCell({
  col,
  isContinuous,
  forecast,
}: Params): GetCostAggregatedCellResult | null {
  const { t } = useTranslation('transactions');
  const isYearMode = useAtomValue(viewModeAtom) === 'year';
  const year = useAtomValue(selectedYearAtom);
  const month = useAtomValue(selectedMonth0BasedAtom);

  if (!col) {
    return null;
  }

  return getCostAggregatedCell({
    col,
    isContinuous,
    forecast,
    isYearMode,
    month,
    year,
    tooltipPlanString: t('forecast.plan', { value: costToString(forecast) }),
  });
}
