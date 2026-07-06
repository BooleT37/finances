import { Group, SegmentedControl } from '@mantine/core';
import { YearPickerInput } from '@mantine/dates';

const quarterOptions = [
  { value: '1', label: 'Q1' },
  { value: '2', label: 'Q2' },
  { value: '3', label: 'Q3' },
  { value: '4', label: 'Q4' },
];

interface QuarterPickerInputProps {
  year: Date;
  quarter: number;
  onYearChange: (year: Date) => void;
  onQuarterChange: (quarter: number) => void;
  'aria-label'?: string;
}

export function QuarterPickerInput({
  year,
  quarter,
  onYearChange,
  onQuarterChange,
  'aria-label': ariaLabel,
}: QuarterPickerInputProps) {
  return (
    <Group gap="xs" wrap="nowrap">
      <YearPickerInput
        aria-label={ariaLabel}
        value={year}
        onChange={(value) => {
          if (value) {
            onYearChange(value);
          }
        }}
        w={100}
      />
      <SegmentedControl
        aria-label={ariaLabel}
        value={quarter.toString()}
        onChange={(value) => {
          onQuarterChange(Number(value));
        }}
        data={quarterOptions}
      />
    </Group>
  );
}
