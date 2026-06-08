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

import { parseCategorySubcategoryId } from '~/features/categories/categorySubcategoryId';
import { renderCategoryTreeNodeTitle } from '~/features/categories/components/renderCategoryTreeNodeTitle';
import { useCategoryTreeData } from '~/features/categories/facets/categoryTreeData';
import { useOrderedSources } from '~/features/sources/facets/orderedSources';
import type { SubscriptionFormValues } from '~/features/subscriptions/components/SubscriptionSidebar/subscriptionFormValues';
import { useCreateSubscription } from '~/features/subscriptions/queries';
import { DatePickerWithTodayInput } from '~/shared/components/DatePickerWithTodayInput';
import { TreeSelect } from '~/shared/components/TreeSelect';

interface Props {
  initialValues: SubscriptionFormValues;
  onSuccess: (subscriptionId: number) => void;
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

  const handleSubmit = form.onSubmit(async (values) => {
    const { categoryId, subcategoryId } = parseCategorySubcategoryId(
      values.categoryId!,
    );
    const result = await createSubscription.mutateAsync({
      name: values.name,
      cost: values.cost,
      period: Number(values.period),
      firstDate: values.firstDate!.format('YYYY-MM-DD'),
      categoryId,
      subcategoryId,
      sourceId: values.sourceId !== null ? Number(values.sourceId) : null,
      active: true,
    });
    modals.closeAll();
    onSuccess(result.id);
  });

  const costValue =
    form.values.cost === '' ? '' : (Number(form.values.cost) as number | '');

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
          value={costValue}
          onChange={(val) =>
            form.setFieldValue('cost', val === '' ? '' : String(val))
          }
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

        <Input.Wrapper
          label={t('form.category')}
          required
          error={form.errors.categoryId}
        >
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
          value={form.values.firstDate?.toDate() ?? null}
          onChange={(val) =>
            form.setFieldValue('firstDate', val ? dayjs(val) : null)
          }
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
