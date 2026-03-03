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

  const showCurrentMonthButton = viewMode !== 'month' || !isCurrentMonth;

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
        <Anchor
          size="xs"
          component="button"
          type="button"
          style={{ visibility: showCurrentMonthButton ? 'visible' : 'hidden' }}
          onClick={() => {
            setViewMode('month');
            setMonth(nowMonth);
            setSearch('');
          }}
        >
          <Flex gap={4} align="center">
            <IconCalendarEvent size={16} />
            {t('backToCurrentMonth')}
          </Flex>
        </Anchor>
      </Group>
    </Stack>
  );
}
