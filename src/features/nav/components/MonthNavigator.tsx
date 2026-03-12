import {
  ActionIcon,
  Button,
  Divider,
  Flex,
  Group,
  Popover,
  Stack,
} from '@mantine/core';
import { MonthPicker, YearPicker } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import {
  IconCalendarEvent,
  IconCalendarMonth,
  IconCalendarStats,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useAtom, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import {
  selectedMonthAtom,
  transactionSearchAtom,
  viewModeAtom,
} from '~/stores/month';

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

export function MonthNavigator() {
  const [selectedMonth, setMonth] = useAtom(selectedMonthAtom);
  const [viewMode, setViewMode] = useAtom(viewModeAtom);
  const setSearch = useSetAtom(transactionSearchAtom);
  const [pickerOpened, { toggle: togglePicker, close: closePicker }] =
    useDisclosure(false);
  const { t, i18n } = useTranslation('nav');

  const now = dayjs();
  const nowMonth = now.format('YYYY-MM');
  const isCurrentMonth = selectedMonth === nowMonth;

  const label = formatLabel(selectedMonth, i18n.language, viewMode);

  const goPrev = () => {
    const unit = viewMode === 'month' ? 'month' : 'year';
    setMonth(dayjs(selectedMonth).subtract(1, unit).format('YYYY-MM'));
  };

  const goNext = () => {
    const unit = viewMode === 'month' ? 'month' : 'year';
    setMonth(dayjs(selectedMonth).add(1, unit).format('YYYY-MM'));
  };

  const handlePickerChange = (date: Date | null) => {
    if (date) {
      setMonth(dayjs(date).format('YYYY-MM'));
      closePicker();
    }
  };

  // Mantine date pickers work with Date objects
  const pickerValue = dayjs(selectedMonth).toDate();

  const nowYear = now.format('YYYY');
  const isCurrentYear = selectedMonth.slice(0, 4) === nowYear;
  const showCurrentButton =
    viewMode === 'month' ? !isCurrentMonth : !isCurrentYear;

  const handleBackToCurrent = () => {
    setViewMode('month');
    setMonth(nowMonth);
    setSearch('');
    closePicker();
  };

  const handleToggleView = () => {
    setViewMode(viewMode === 'month' ? 'year' : 'month');
  };

  return (
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
          <Stack gap={0}>
            {viewMode === 'month' ? (
              <MonthPicker value={pickerValue} onChange={handlePickerChange} />
            ) : (
              <YearPicker value={pickerValue} onChange={handlePickerChange} />
            )}
            <Divider />
            <Stack gap={4} p="8px 0" align="center">
              {showCurrentButton && (
                <Button
                  variant="white"
                  size="xs"
                  onClick={handleBackToCurrent}
                  w="100%"
                >
                  <Flex gap={4} align="center">
                    <IconCalendarEvent size={14} />
                    {viewMode === 'month'
                      ? t('backToCurrentMonth')
                      : t('backToCurrentYear')}
                  </Flex>
                </Button>
              )}
              <Button
                variant="white"
                size="xs"
                onClick={handleToggleView}
                w="100%"
              >
                <Flex gap={4} align="center">
                  {viewMode === 'month' ? (
                    <IconCalendarStats size={14} />
                  ) : (
                    <IconCalendarMonth size={14} />
                  )}
                  {viewMode === 'month'
                    ? t('switchToYearView')
                    : t('switchToMonthView')}
                </Flex>
              </Button>
            </Stack>
          </Stack>
        </Popover.Dropdown>
      </Popover>

      <ActionIcon variant="subtle" size="md" onClick={goNext} aria-label="Next">
        <IconChevronRight size={16} />
      </ActionIcon>
    </Group>
  );
}
