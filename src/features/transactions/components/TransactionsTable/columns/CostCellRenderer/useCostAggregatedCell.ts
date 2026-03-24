import dayjs from 'dayjs';
import Decimal from 'decimal.js';
import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
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

interface Params {
  col: CostCol | null;
  isContinuous: boolean;
  forecast: Decimal;
}

export type UseCostAggregatedCellResult =
  | null
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

export function useCostAggregatedCell({
  col,
  isContinuous,
  forecast,
}: Params): UseCostAggregatedCellResult {
  const { t } = useTranslation('transactions');
  const isYearMode = useAtomValue(viewModeAtom) === 'year';
  const year = useAtomValue(selectedYearAtom);
  const month = useAtomValue(selectedMonth0BasedAtom);

  // getToday() is called at render time (not module load), so vi.setSystemTime() can mock it in tests
  const passedDaysRatio = useMemo((): number | null => {
    if (isYearMode) {
      return null;
    }
    const today = getToday();
    const isCurrentMonth = today.month() === month && today.year() === year;
    const daysInMonth = dayjs(new Date(year, month)).daysInMonth();
    return isCurrentMonth ? today.date() / daysInMonth : 1;
  }, [isYearMode, month, year]);

  if (!col) {
    return null;
  }

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

  const forecastNumber = forecast.toNumber();
  const diff = value.minus(forecast);
  const diffNumber = diff.toNumber();
  const valueNumber = value.toNumber();
  const tooltip = t('forecast.plan', { value: costToString(forecast) });
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
        tooltip,
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
      tooltip,
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
    tooltip,
  };
}
