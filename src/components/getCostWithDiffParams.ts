import dayjs from 'dayjs';
import Decimal from 'decimal.js';

import { divideWithFallbackToOne } from '~/shared/utils/divideWithFallbackToOne';
import { getToday } from '~/shared/utils/today';

export interface GetCostWithDiffParamsResult {
  /** The difference between the cost and the forecast */
  diff: Decimal;
  /* The bar color under the cost. It is always drawn on top of white bordered bar which width is taken as 100% */
  color: 'green' | 'red' | 'orange';
  /** How long the colored bar is, in % */
  barLength: number;
  /** For over budget costs, we put the red bar to the right side, offset indicates where it starts, in % */
  barOffset: number;
  /** For exceeding (but not yet over budget) continuous forecasts, this is the amount the forecast is exceeding by */
  exceedingAmount?: Decimal;
}

interface CostColValue {
  cost: Decimal;
}

interface GetCostWithDiffParamsInput {
  value: CostColValue;
  isContinuous: boolean;
  forecast: Decimal;
  /** 1-based month (1-12) */
  month: number;
  year: number;
}

export function getCostWithDiffParams({
  value,
  isContinuous,
  forecast,
  month,
  year,
}: GetCostWithDiffParamsInput): GetCostWithDiffParamsResult {
  // getToday() is called at invocation time (not module load), so vi.setSystemTime() can mock it in tests
  const today = getToday();
  // today.month() is 0-based; month is 1-based
  const isCurrentMonth = today.month() + 1 === month && today.year() === year;
  const daysInMonth = dayjs(new Date(year, month - 1)).daysInMonth();

  const passedDaysRatio = isCurrentMonth ? today.date() / daysInMonth : 1;

  const forecastNumber = forecast.toNumber();
  const diff = value.cost.minus(forecast);
  const costNumber = value.cost.toNumber();
  const color: 'green' | 'red' = diff.isNeg() ? 'red' : 'green';

  if (forecastNumber !== 0 && costNumber * forecastNumber < 0) {
    console.warn(
      'getCostWithDiffParams: cost and forecast have opposite signs',
      { cost: costNumber, forecast: forecastNumber },
    );
  }

  if (value.cost.abs().lessThanOrEqualTo(forecast.abs())) {
    const spentRatio = divideWithFallbackToOne(costNumber, forecastNumber);
    const exceedingForecast =
      isContinuous && passedDaysRatio !== null && spentRatio > passedDaysRatio;

    if (exceedingForecast) {
      return {
        diff,
        color: 'orange',
        barOffset: 0,
        barLength: spentRatio,
        exceedingAmount: new Decimal(
          Math.abs(costNumber - passedDaysRatio * forecastNumber),
        ),
      };
    }

    return {
      diff,
      color,
      barOffset: 0,
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
