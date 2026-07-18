import dayjs, { type Dayjs } from 'dayjs';

import { MONTH_DATE_FORMAT } from '~/shared/constants';

export type Granularity = 'month' | 'quarter' | 'year';

export interface PeriodAnchor {
  /** Any date within the target period (ISO_DATE_FORMAT string). For granularity="quarter", only its year is used. */
  date: string;
  /** 1-4, used only when granularity === 'quarter'. */
  quarter: number;
}

export interface PeriodRange {
  start: Dayjs;
  end: Dayjs;
}

export function resolvePeriodRange(
  granularity: Granularity,
  anchor: PeriodAnchor,
): PeriodRange {
  const anchorDate = dayjs(anchor.date);
  if (granularity === 'month') {
    return {
      start: anchorDate.startOf('month'),
      end: anchorDate.endOf('month'),
    };
  }
  if (granularity === 'year') {
    return { start: anchorDate.startOf('year'), end: anchorDate.endOf('year') };
  }
  const start = anchorDate
    .startOf('year')
    .add((anchor.quarter - 1) * 3, 'month');
  return { start, end: start.add(2, 'month').endOf('month') };
}

export function formatPeriodLabel(
  granularity: Granularity,
  period: PeriodRange,
  locale: string,
): string {
  if (granularity === 'month') {
    return period.start.locale(locale).format(MONTH_DATE_FORMAT);
  }
  if (granularity === 'year') {
    return period.start.format('YYYY');
  }
  const quarter = Math.floor(period.start.month() / 3) + 1;
  return `Q${quarter} ${period.start.format('YYYY')}`;
}
