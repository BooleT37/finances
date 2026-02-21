import 'dayjs/locale/ru';

import {
  ActionIcon,
  Anchor,
  Button,
  Flex,
  Group,
  Popover,
  Stack,
} from '@mantine/core';
import { MonthPicker, YearPicker } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import {
  IconCalendarEvent,
  IconChevronLeft,
  IconChevronRight,
  IconSwitch2,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { selectedMonthAtom, viewModeAtom } from '~/store/month';

function formatCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatLabel(
  monthStr: string,
  lang: string,
  viewMode: 'month' | 'year',
): string {
  if (viewMode === 'year') {
    return monthStr.slice(0, 4);
  }
  const formatted = dayjs(monthStr).locale(lang).format('MMMM YYYY');
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

interface MonthNavigatorProps {
  showYearToggle: boolean;
}

export function MonthNavigator({ showYearToggle }: MonthNavigatorProps) {
  const [selectedMonth, setMonth] = useAtom(selectedMonthAtom);
  const [viewMode, setViewMode] = useAtom(viewModeAtom);
  const [pickerOpened, { toggle: togglePicker, close: closePicker }] =
    useDisclosure(false);
  const { t, i18n } = useTranslation('nav');

  const nowMonth = formatCurrentMonth();
  const nowYear = new Date().getFullYear();
  const selectedYear = parseInt(selectedMonth.slice(0, 4));

  const isCurrentPeriod =
    viewMode === 'month'
      ? selectedMonth === nowMonth
      : selectedYear === nowYear;

  const label = formatLabel(selectedMonth, i18n.language, viewMode);

  const goPrev = () => {
    const unit = viewMode === 'month' ? 'month' : 'year';
    setMonth(dayjs(selectedMonth).subtract(1, unit).format('YYYY-MM'));
  };

  const goNext = () => {
    const unit = viewMode === 'month' ? 'month' : 'year';
    setMonth(dayjs(selectedMonth).add(1, unit).format('YYYY-MM'));
  };

  const goToNow = () => setMonth(nowMonth);

  const handlePickerChange = (date: Date | null) => {
    if (date) {
      setMonth(dayjs(date).format('YYYY-MM'));
      closePicker();
    }
  };

  // Mantine date pickers work with Date objects
  const pickerValue = dayjs(selectedMonth).toDate();

  return (
    <Stack gap={2} align="center">
      <Group gap={4} wrap="nowrap">
        <ActionIcon
          variant="subtle"
          size="md"
          onClick={goPrev}
          aria-label="Previous"
        >
          <IconChevronLeft size={16} />
        </ActionIcon>

        <Popover
          opened={pickerOpened}
          onDismiss={closePicker}
          position="bottom"
          withArrow
        >
          <Popover.Target>
            <Button
              variant="white"
              c="black"
              onClick={togglePicker}
              fw={600}
              miw={160}
              ta="center"
              style={{ lineHeight: 1.4 }}
            >
              {label}
            </Button>
          </Popover.Target>
          <Popover.Dropdown p={0}>
            {viewMode === 'month' ? (
              <MonthPicker value={pickerValue} onChange={handlePickerChange} />
            ) : (
              <YearPicker value={pickerValue} onChange={handlePickerChange} />
            )}
          </Popover.Dropdown>
        </Popover>

        <ActionIcon
          variant="subtle"
          size="md"
          onClick={goNext}
          aria-label="Next"
        >
          <IconChevronRight size={16} />
        </ActionIcon>
      </Group>

      <Group gap="xs" justify="center">
        {!isCurrentPeriod && (
          <Anchor size="xs" component="button" type="button" onClick={goToNow}>
            <Flex gap={4} align="center">
              <IconCalendarEvent size={16} />
              {viewMode === 'month' ? t('thisMonth') : t('thisYear')}
            </Flex>
          </Anchor>
        )}
        {showYearToggle && (
          <Anchor
            size="xs"
            component="button"
            type="button"
            onClick={() => setViewMode(viewMode === 'month' ? 'year' : 'month')}
          >
            <Flex gap={4} align="center">
              <IconSwitch2 size={16} />
              {viewMode === 'month' ? t('yearView') : t('monthView')}
            </Flex>
          </Anchor>
        )}
      </Group>
    </Stack>
  );
}
