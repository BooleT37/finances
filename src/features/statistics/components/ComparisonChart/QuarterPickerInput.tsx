import { Group, Input, SegmentedControl } from '@mantine/core';
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
  label: string;
}

export function QuarterPickerInput({
  year,
  quarter,
  onYearChange,
  onQuarterChange,
  label,
}: QuarterPickerInputProps) {
  return (
    <Input.Wrapper label={label}>
      <Group gap="xs" wrap="nowrap">
        <YearPickerInput
          aria-label={label}
          value={year}
          onChange={(value) => {
            if (value) {
              onYearChange(value);
            }
          }}
          w={100}
        />
        <SegmentedControl
          aria-label={label}
          value={quarter.toString()}
          onChange={(value) => {
            onQuarterChange(Number(value));
          }}
          data={quarterOptions}
        />
      </Group>
    </Input.Wrapper>
  );
}
