import { BarChart } from '@mantine/charts';
import {
  Alert,
  Group,
  Select,
  Stack,
  Switch,
  Text,
  Title,
} from '@mantine/core';
import { MonthPickerInput, YearPickerInput } from '@mantine/dates';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useSortAllCategoriesById } from '~/features/categories/facets/categoriesOrder';
import { getCategoryMapQueryOptions } from '~/features/categories/facets/categoryMap';
import { API_DATE_FORMAT } from '~/shared/constants';
import { costToString } from '~/shared/utils/costToString';
import { getOrThrow } from '~/shared/utils/getOrThrow';

import { getComparisonDataQueryOptions } from '../../queries';
import {
  formatPeriodLabel,
  type Granularity,
  resolvePeriodRange,
} from './period';
import { QuarterPickerInput } from './QuarterPickerInput';

type SortOption = 'category' | 'period1' | 'period2';

const today = dayjs().startOf('month');
const lastMonth = today.subtract(1, 'month');

interface PeriodPickerProps {
  granularity: Granularity;
  date: Date;
  quarter: number;
  onDateChange: (date: Date) => void;
  onQuarterChange: (quarter: number) => void;
  label: string;
}

function PeriodPicker({
  granularity,
  date,
  quarter,
  onDateChange,
  onQuarterChange,
  label,
}: PeriodPickerProps) {
  if (granularity === 'month') {
    return (
      <MonthPickerInput
        label={label}
        value={date}
        onChange={(value) => value && onDateChange(value)}
        w={160}
      />
    );
  }
  if (granularity === 'year') {
    return (
      <YearPickerInput
        label={label}
        value={date}
        onChange={(value) => value && onDateChange(value)}
        w={100}
      />
    );
  }
  return (
    <QuarterPickerInput
      label={label}
      year={date}
      quarter={quarter}
      onYearChange={onDateChange}
      onQuarterChange={onQuarterChange}
    />
  );
}

export function ComparisonChart() {
  const { t, i18n } = useTranslation('statistics');
  const [granularity, setGranularity] = useState<Granularity>('month');
  const [period1Date, setPeriod1Date] = useState<Date>(lastMonth.toDate());
  const [period2Date, setPeriod2Date] = useState<Date>(today.toDate());
  const [period1Quarter, setPeriod1Quarter] = useState(1);
  const [period2Quarter, setPeriod2Quarter] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('category');
  const [showIncome, setShowIncome] = useState(false);

  const period1 = resolvePeriodRange(granularity, {
    date: period1Date,
    quarter: period1Quarter,
  });
  const period2 = resolvePeriodRange(granularity, {
    date: period2Date,
    quarter: period2Quarter,
  });
  const samePeriod =
    period1.start.isSame(period2.start, 'day') &&
    period1.end.isSame(period2.end, 'day');

  const { data: comparisonData } = useQuery({
    ...getComparisonDataQueryOptions({
      period1: {
        start: period1.start.format(API_DATE_FORMAT),
        end: period1.end.format(API_DATE_FORMAT),
      },
      period2: {
        start: period2.start.format(API_DATE_FORMAT),
        end: period2.end.format(API_DATE_FORMAT),
      },
    }),
    enabled: !samePeriod,
  });
  const { data: categoryMap } = useQuery(getCategoryMapQueryOptions());
  const { sortAllCategoriesById } = useSortAllCategoriesById();

  const chartData = useMemo(() => {
    if (!comparisonData || !categoryMap) {
      return [];
    }
    return comparisonData
      .filter((row) => {
        const category = getOrThrow(categoryMap, row.categoryId, 'Category');
        return (
          category.type !== 'TO_SAVINGS' && (showIncome || !category.isIncome)
        );
      })
      .map((row) => ({
        categoryId: row.categoryId,
        category: getOrThrow(categoryMap, row.categoryId, 'Category').shortname,
        period1: row.period1,
        period2: row.period2,
      }))
      .sort((a, b) => {
        if (sortBy === 'category') {
          return sortAllCategoriesById(a.categoryId, b.categoryId);
        }
        return b[sortBy] - a[sortBy];
      });
  }, [comparisonData, categoryMap, showIncome, sortBy, sortAllCategoriesById]);

  const period1Label = formatPeriodLabel(granularity, period1, i18n.language);
  const period2Label = formatPeriodLabel(granularity, period2, i18n.language);

  return (
    <Stack gap="sm">
      <Title order={3}>{t('comparison.title')}</Title>
      <Group align="flex-end">
        <Select
          label={t('comparison.granularity.label')}
          value={granularity}
          onChange={(value) => value && setGranularity(value as Granularity)}
          data={[
            { value: 'month', label: t('comparison.granularity.month') },
            { value: 'quarter', label: t('comparison.granularity.quarter') },
            { value: 'year', label: t('comparison.granularity.year') },
          ]}
          w={130}
        />
        <PeriodPicker
          label={t('comparison.period1Label')}
          granularity={granularity}
          date={period1Date}
          quarter={period1Quarter}
          onDateChange={setPeriod1Date}
          onQuarterChange={setPeriod1Quarter}
        />
        <Text pb={8}>–</Text>
        <PeriodPicker
          label={t('comparison.period2Label')}
          granularity={granularity}
          date={period2Date}
          quarter={period2Quarter}
          onDateChange={setPeriod2Date}
          onQuarterChange={setPeriod2Quarter}
        />
        <Select
          label={t('comparison.sortBy.label')}
          value={sortBy}
          onChange={(value) => value && setSortBy(value as SortOption)}
          data={[
            { value: 'category', label: t('comparison.sortBy.category') },
            { value: 'period1', label: t('comparison.sortBy.period1') },
            { value: 'period2', label: t('comparison.sortBy.period2') },
          ]}
          w={180}
        />
        <Switch
          checked={showIncome}
          onChange={(e) => setShowIncome(e.currentTarget.checked)}
          label={
            showIncome
              ? t('comparison.includeIncome')
              : t('comparison.expensesOnly')
          }
        />
      </Group>
      {samePeriod ? (
        <Alert color="yellow">{t('comparison.samePeriodWarning')}</Alert>
      ) : comparisonData && categoryMap && chartData.length === 0 ? (
        <Text c="dimmed" p="md">
          {t('comparison.emptyState')}
        </Text>
      ) : (
        <BarChart
          h={600}
          data={chartData}
          dataKey="category"
          orientation="vertical"
          series={[
            { name: 'period1', label: period1Label, color: 'blue.6' },
            { name: 'period2', label: period2Label, color: 'orange.6' },
          ]}
          valueFormatter={(value) => costToString(value)}
          withLegend
        />
      )}
    </Stack>
  );
}
