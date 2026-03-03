import dayjs from 'dayjs';

import { getToday } from '~/shared/utils/today';

const today = getToday();

export function getPassedDaysRatio({
  currentMonth,
  currentYear,
  isRangePicker,
}: {
  currentMonth: number;
  currentYear: number;
  isRangePicker: boolean;
}): number | null {
  if (isRangePicker) {
    return null;
  }
  const isCurrentMonth =
    today.month() === currentMonth && today.year() === currentYear;
  const daysInMonth = dayjs(new Date(currentYear, currentMonth)).daysInMonth();
  return isCurrentMonth ? today.date() / daysInMonth : 1;
}
