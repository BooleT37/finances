import {
  Button,
  Group,
  Input,
  NumberInput,
  Select,
  Stack,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { CategorySubcategoryId } from '~/features/categories/categorySubcategoryId';
import { parseCategorySubcategoryId } from '~/features/categories/categorySubcategoryId';
import { renderCategoryTreeNodeTitle } from '~/features/categories/components/renderCategoryTreeNodeTitle';
import { useCategoryTreeData } from '~/features/categories/facets/categoryTreeData';
import { useOrderedSources } from '~/features/sources/facets/orderedSources';
import { useCreateSubscription } from '~/features/subscriptions/queries';
import { DatePickerWithTodayInput } from '~/shared/components/DatePickerWithTodayInput';
import { TreeSelect } from '~/shared/components/TreeSelect';

interface SubscriptionFormValues {
  name: string;
  cost: string;
  period: '1' | '3' | '6' | '12';
  categoryId: CategorySubcategoryId | null;
  firstDate: Date | null;
  sourceId: string | null;
}

interface ValidatedSubscriptionFormValues extends SubscriptionFormValues {
  categoryId: CategorySubcategoryId;
  firstDate: Date;
}

interface SubscriptionCreatedValues {
  subscriptionId: number;
  categoryId: CategorySubcategoryId | null;
  sourceId: string | null;
  name: string;
}

interface Props {
  initialValues: SubscriptionFormValues;
  onSuccess: (values: SubscriptionCreatedValues) => void;
}

export function CreateSubscriptionModal({ initialValues, onSuccess }: Props) {
  const { t } = useTranslation('subscriptions');
  const createSubscription = useCreateSubscription();
  const categoryTreeData = useCategoryTreeData();
  const orderedSources = useOrderedSources();

  const sourceOptions = useMemo(
    () =>
      (orderedSources ?? []).map((s) => ({
        value: String(s.id),
        label: s.name,
      })),
    [orderedSources],
  );

  const periodOptions = useMemo(
    () => [
      { value: '1', label: t('form.periodMonth') },
      { value: '3', label: t('form.periodQuarter') },
      { value: '6', label: t('form.periodSixMonths') },
      { value: '12', label: t('form.periodYear') },
    ],
    [t],
  );

  const form = useForm<SubscriptionFormValues>({
    initialValues,
    validate: {
      name: (value) =>
        value.trim().length === 0 ? t('form.errors.nameRequired') : null,
      cost: (value) =>
        value.trim().length === 0 || isNaN(Number(value))
          ? t('form.errors.priceRequired')
          : null,
      categoryId: (value) =>
        value === null ? t('form.errors.categoryRequired') : null,
      firstDate: (value) =>
        value === null ? t('form.errors.firstDateRequired') : null,
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    const validated = values as ValidatedSubscriptionFormValues;
    const { categoryId, subcategoryId } = parseCategorySubcategoryId(
      validated.categoryId,
    );
    createSubscription.mutate(
      {
        name: validated.name,
        cost: validated.cost,
        period: Number(validated.period),
        firstDate: dayjs(validated.firstDate).format('YYYY-MM-DD'),
        categoryId,
        subcategoryId,
        sourceId:
          validated.sourceId !== null ? Number(validated.sourceId) : null,
        active: true,
      },
      {
        onSuccess: (result) => {
          modals.closeAll();
          onSuccess({
            subscriptionId: result.id,
            categoryId: validated.categoryId,
            sourceId: validated.sourceId,
            name: validated.name,
          });
        },
      },
    );
  });

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="sm">
        <TextInput
          label={t('form.name')}
          required
          {...form.getInputProps('name')}
        />

        <NumberInput
          label={t('form.price')}
          required
          decimalScale={2}
          min={0}
          value={form.values.cost}
          onChange={(val) => form.setFieldValue('cost', String(val))}
          error={form.errors.cost}
          rightSectionWidth={200}
          rightSection={
            <Select
              value={form.values.period}
              onChange={(val) =>
                form.setFieldValue(
                  'period',
                  (val ?? '1') as SubscriptionFormValues['period'],
                )
              }
              data={periodOptions}
              size="xs"
              variant="unstyled"
              allowDeselect={false}
              styles={{ input: { textAlign: 'right', paddingRight: 28 } }}
            />
          }
          rightSectionPointerEvents="all"
        />

        <Input.Wrapper label={t('form.category')} required>
          <TreeSelect
            treeData={categoryTreeData ?? []}
            titleRender={renderCategoryTreeNodeTitle}
            {...form.getInputProps('categoryId')}
          />
        </Input.Wrapper>

        <DatePickerWithTodayInput
          label={t('form.firstDate')}
          required
          valueFormat="DD.MM.YYYY"
          value={form.values.firstDate}
          onChange={(val) => form.setFieldValue('firstDate', val)}
          error={form.errors.firstDate}
        />

        <Select
          label={t('form.source')}
          data={sourceOptions}
          clearable
          {...form.getInputProps('sourceId')}
        />

        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={() => modals.closeAll()}>
            {t('form.cancel')}
          </Button>
          <Button type="submit" loading={createSubscription.isPending}>
            {t('form.add')}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
