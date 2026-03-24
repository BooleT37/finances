import dayjs from 'dayjs';

const isTestMode = process.env.NODE_ENV === 'test';

export const TODAY_YEAR = 2024;
export const TODAY_MONTH = 3; // April, since it's 0-based
export const TODAY_DAY = 15;

export const getToday = () => {
  if (isTestMode) {
    return dayjs(`${TODAY_YEAR}-${TODAY_MONTH + 1}-${TODAY_DAY}`);
  }
  return dayjs();
};
