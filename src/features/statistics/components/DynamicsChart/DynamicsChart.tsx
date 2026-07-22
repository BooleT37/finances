import { LineChart } from '@mantine/charts';
import {
  Alert,
  type ComboboxItem,
  Group,
  MultiSelect,
  Pill,
  Stack,
  Title,
} from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { NameWithOptionalIcon } from '~/features/categories/components/NameWithOptionalIcon';
import { getCategoryMapQueryOptions } from '~/features/categories/facets/categoryMap';
import { getCategoriesQueryOptions } from '~/features/categories/queries';
import { ISO_DATE_FORMAT, MONTH_DATE_FORMAT } from '~/shared/constants';
import { costToString } from '~/shared/utils/costToString';
import { getOrThrow } from '~/shared/utils/getOrThrow';

import { getDynamicsDataQueryOptions } from '../../queries';
import { DynamicsChartLegend } from './DynamicsChartLegend';

const palette = [
  'blue.6',
  'orange.6',
  'green.6',
  'red.6',
  'grape.6',
  'cyan.6',
  'lime.6',
  'pink.6',
  'indigo.6',
  'yellow.6',
];

const today = dayjs().startOf('month');
const defaultFrom = today.subtract(11, 'month');

interface CategoryOption extends ComboboxItem {
  icon: string | null;
}

export function DynamicsChart() {
  const { t, i18n } = useTranslation('statistics');
  const [range, setRange] = useState<[string | null, string | null]>([
    defaultFrom.format(ISO_DATE_FORMAT),
    today.format(ISO_DATE_FORMAT),
  ]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);

  const [from, to] = range;
  const sameMonth = !from || !to || dayjs(from).isSame(to, 'month');

  const { data: categories } = useQuery(getCategoriesQueryOptions());
  const { data: categoryMap } = useQuery(getCategoryMapQueryOptions());

  const { data: dynamicsData } = useQuery({
    ...getDynamicsDataQueryOptions({
      // fallback only to make typescript happy
      from: from ?? today.format(ISO_DATE_FORMAT),
      to: to ?? today.format(ISO_DATE_FORMAT),
      categoryIds: categoryIds.map(Number),
    }),
    enabled: !sameMonth,
  });

  const categoryOptions = useMemo<CategoryOption[]>(
    () =>
      (categories ?? []).map((category) => ({
        value: category.id.toString(),
        label: category.shortname,
        icon: category.icon,
      })),
    [categories],
  );

  const series = useMemo(() => {
    if (!dynamicsData || dynamicsData.length === 0) {
      return [];
    }
    return Object.keys(dynamicsData[0])
      .filter((key) => key !== 'month')
      .map((categoryId, index) => ({
        name: categoryId,
        label: categoryMap
          ? getOrThrow(categoryMap, categoryId, 'Category').shortname
          : categoryId,
        color: palette[index % palette.length],
      }));
  }, [dynamicsData, categoryMap]);

  const chartData = useMemo(
    () =>
      (dynamicsData ?? []).map((row) => ({
        ...row,
        month: dayjs(row.month, 'YYYY-MM')
          .locale(i18n.language)
          .format(MONTH_DATE_FORMAT),
      })),
    [dynamicsData, i18n.language],
  );

  return (
    <Stack gap="sm">
      <Title order={3}>{t('dynamics.title')}</Title>
      <Group align="flex-end">
        <MonthPickerInput
          type="range"
          label={t('dynamics.rangeLabel')}
          value={range}
          onChange={setRange}
          valueFormat={MONTH_DATE_FORMAT}
          w={260}
        />
        <MultiSelect
          label={t('dynamics.categoriesLabel')}
          placeholder={
            categoryIds.length === 0
              ? t('dynamics.categoriesPlaceholder')
              : undefined
          }
          data={categoryOptions}
          value={categoryIds}
          onChange={setCategoryIds}
          clearable
          w={400}
          renderOption={({ option }) => (
            <NameWithOptionalIcon
              name={option.label}
              icon={(option as CategoryOption).icon}
              reserveIconSpace
            />
          )}
          renderPill={({ option, onRemove, disabled }) => (
            <Pill withRemoveButton={!disabled} onRemove={onRemove}>
              <NameWithOptionalIcon
                name={option.label}
                icon={(option as CategoryOption).icon}
              />
            </Pill>
          )}
        />
      </Group>
      {sameMonth ? (
        <Alert color="yellow">{t('dynamics.samePeriodWarning')}</Alert>
      ) : (
        <LineChart
          h={400}
          px="lg"
          data={chartData}
          dataKey="month"
          series={series}
          valueFormatter={(value) => costToString(value)}
          withLegend
          legendProps={{
            content: (props) => (
              <DynamicsChartLegend
                payload={props.payload}
                categoryMap={categoryMap ?? {}}
              />
            ),
          }}
        />
      )}
    </Stack>
  );
}
