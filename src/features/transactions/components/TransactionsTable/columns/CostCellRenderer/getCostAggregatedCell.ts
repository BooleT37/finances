import dayjs from 'dayjs';
import Decimal from 'decimal.js';

import { divideWithFallbackToOne } from '~/shared/utils/divideWithFallbackToOne';
import { getToday } from '~/shared/utils/today';

import type { CostColValue } from '../../TransactionsTable.types';

export interface GetCostAggregatedCellResult {
  /** The difference between the cost and the forecast */
  diff: Decimal;
  /* The bar color under the cost. It is always drawn on top of white bordered bar which width is taken as 100% */
  color: 'green' | 'red' | 'orange';
  /** How long the colored bar is, in % */
  barLength: number;
  /** For over budget costs, we put the red bar to the right side, offset indicates where it starts, in % */
  barOffset?: number;
  /** For exceeding (but not yet over budget) continuous forecasts, this is the amount the forecast is exceeding by */
  exceedingAmount?: Decimal;
}

interface GetCostAggregatedCellParams {
  value: CostColValue;
  isContinuous: boolean;
  forecast: Decimal;
  month: number;
  year: number;
}

export function getCostAggregatedCell({
  value,
  isContinuous,
  forecast,
  month,
  year,
}: GetCostAggregatedCellParams): GetCostAggregatedCellResult {
  // getToday() is called at invocation time (not module load), so vi.setSystemTime() can mock it in tests
  const today = getToday();
  const isCurrentMonth = today.month() === month && today.year() === year;
  const daysInMonth = dayjs(new Date(year, month)).daysInMonth();

  const passedDaysRatio = isCurrentMonth ? today.date() / daysInMonth : 1;

  const forecastNumber = forecast.toNumber();
  const diff = value.cost.minus(forecast);
  const costNumber = value.cost.toNumber();
  const color: 'green' | 'red' = diff.isNeg() ? 'red' : 'green';

  if (value.cost.abs().lessThanOrEqualTo(forecast.abs())) {
    const spentRatio = divideWithFallbackToOne(costNumber, forecastNumber);
    const exceedingForecast =
      isContinuous && passedDaysRatio !== null && spentRatio > passedDaysRatio;

    if (exceedingForecast) {
      return {
        diff,
        color: 'orange',
        barLength: spentRatio,
        exceedingAmount: new Decimal(
          Math.abs(costNumber - passedDaysRatio * forecastNumber),
        ),
      };
    }

    return {
      diff,
      color,
      barLength: spentRatio,
    };
  }

  return {
    diff,
    color,
    barOffset: forecastNumber / costNumber,
    barLength: diff.toNumber() / costNumber,
  };
}
