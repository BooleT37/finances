import {
  Alert,
  Button,
  Input,
  NumberInput,
  Select,
  Stack,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDebouncedCallback } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { useMolecule } from 'bunshi/react';
import dayjs from 'dayjs';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  buildCategorySubcategoryId,
  parseCategorySubcategoryId,
} from '~/features/categories/categorySubcategoryId';
import { useCategoryTreeData } from '~/features/categories/facets/categoryTreeData';
import { useOrderedSources } from '~/features/sources/facets/orderedSources';
import { DatePickerWithTodayInput } from '~/shared/components/DatePickerWithTodayInput';
import { TreeSelect } from '~/shared/components/TreeSelect';

import {
  getSubscriptionsQueryOptions,
  useCreateSubscription,
  useUpdateSubscription,
} from '../../queries';
import type { Subscription } from '../../schema';
import { insertedSubscriptionAtom } from '../SubscriptionsTable/flashSubscription';
import type { SubscriptionFormValues } from './subscriptionFormValues';
import { SubscriptionSidebarMolecule } from './subscriptionSidebarMolecule';

function subscriptionToFormValues(s: Subscription): SubscriptionFormValues {
  return {
    name: s.name,
    cost: s.cost.abs().toString(),
    period: String(s.period) as SubscriptionFormValues['period'],
    categoryId: buildCategorySubcategoryId({
      categoryId: s.categoryId,
      subcategoryId: s.subcategoryId,
    }),
    firstDate: s.firstDate,
    sourceId: s.sourceId !== null ? String(s.sourceId) : null,
  };
}

export function SubscriptionSidebarForm() {
  const { editingIdAtom, isNewSubscriptionAtom, formRefAtom, closeAtom } =
    useMolecule(SubscriptionSidebarMolecule);
  const editingId = useAtomValue(editingIdAtom);
  const isNew = useAtomValue(isNewSubscriptionAtom);
  const setFormRef = useSetAtom(formRefAtom);
  const close = useSetAtom(closeAtom);
  const setInsertedSubscription = useSetAtom(insertedSubscriptionAtom);
  const store = useStore();
  const { t } = useTranslation('subscriptions');

  const { data: subscriptions } = useQuery(getSubscriptionsQueryOptions());
  const currentSubscription = useMemo(
    () => subscriptions?.find((s) => s.id === editingId) ?? null,
    [subscriptions, editingId],
  );

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

  const updateSubscription = useUpdateSubscription();
  const createSubscription = useCreateSubscription();

  const initialValues = useMemo((): SubscriptionFormValues => {
    if (currentSubscription) {
      return subscriptionToFormValues(currentSubscription);
    }
    return {
      name: '',
      cost: '',
      period: '1',
      categoryId: null,
      firstDate: null,
      sourceId: null,
    };
  }, [currentSubscription]);

  const debouncedSave = useDebouncedCallback(
    async (values: SubscriptionFormValues, active: boolean | undefined) => {
      const f = store.get(formRefAtom);
      if (
        editingId == null ||
        active == null ||
        !f?.isValid() ||
        !f?.isDirty()
      ) {
        return;
      }
      if (!values.categoryId || !values.firstDate) {
        return;
      }

      const { categoryId, subcategoryId } = parseCategorySubcategoryId(
        values.categoryId,
      );

      await updateSubscription.mutateAsync({
        id: editingId,
        name: values.name,
        cost: values.cost,
        period: Number(values.period),
        firstDate: values.firstDate.format('YYYY-MM-DD'),
        categoryId,
        subcategoryId,
        sourceId: values.sourceId !== null ? Number(values.sourceId) : null,
        active,
      });
      f.resetDirty();
    },
    600,
  );

  const form = useForm<SubscriptionFormValues>({
    initialValues,
    validateInputOnBlur: true,
    onValuesChange: (values) =>
      debouncedSave(values, currentSubscription?.active),
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

  useEffect(() => {
    setFormRef(form);
    return () => setFormRef(null);
  }, [form, setFormRef]);

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
    form.reset();
    close();
    setInsertedSubscription({ id: result.id, categoryId: result.categoryId });
  });

  const costValue =
    form.values.cost === '' ? '' : (Number(form.values.cost) as number | '');

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="sm" pr={16}>
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

        {!isNew && Object.keys(form.errors).length > 0 && (
          <Alert color="yellow" p="xs">
            {t('form.unsavedChanges')}
          </Alert>
        )}

        {isNew && (
          <Button type="submit" mt="sm" disabled={!form.isDirty()}>
            {t('form.add')}
          </Button>
        )}
      </Stack>
    </form>
  );
}
