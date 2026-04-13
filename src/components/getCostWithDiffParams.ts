import dayjs from 'dayjs';
import Decimal from 'decimal.js';

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

interface GetCostWithDiffParamsInput {
  cost: Decimal;
  isContinuous: boolean;
  forecast: Decimal;
  /** 0-based month (0-11) */
  month: number;
  year: number;
}

export function getCostWithDiffParams({
  cost,
  isContinuous,
  forecast,
  month,
  year,
}: GetCostWithDiffParamsInput): GetCostWithDiffParamsResult {
  // getToday() is called at invocation time (not module load), so vi.setSystemTime() can mock it in tests
  const today = getToday();
  const isCurrentMonth = today.month() === month && today.year() === year;
  const daysInMonth = dayjs(new Date(year, month)).daysInMonth();

  const passedDaysRatio = isCurrentMonth ? today.date() / daysInMonth : 1;

  const forecastNumber = forecast.toNumber();
  const diff = cost.minus(forecast);
  const costNumber = cost.toNumber();
  const color: 'green' | 'red' = diff.isNeg() ? 'red' : 'green';

  if (cost.isNeg() !== forecast.isNeg()) {
    return {
      diff,
      color,
      barLength: 1,
      barOffset: 0,
    };
  }

  if (cost.abs().lessThanOrEqualTo(forecast.abs())) {
    const spentRatio = forecastNumber === 0 ? 0 : costNumber / forecastNumber;
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
