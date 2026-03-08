import {
  DatePickerInput,
  type DatePickerInputProps,
  type DatePickerType,
} from '@mantine/dates';
import dayjs from 'dayjs';

const getTodayDayProps = (date: Date) =>
  dayjs(date).isSame(dayjs(), 'day')
    ? { style: { border: '1px solid currentColor', borderRadius: 4 } }
    : {};

export function DatePickerWithTodayInput<
  Type extends DatePickerType = 'default',
>(props: DatePickerInputProps<Type>) {
  return <DatePickerInput<Type> getDayProps={getTodayDayProps} {...props} />;
}
