import type { UseFormReturnType } from '@mantine/form';

import type { CategorySubcategoryId } from '~/features/categories/categorySubcategoryId';

export interface SubscriptionFormValues {
  name: string;
  cost: string;
  period: '1' | '3' | '6' | '12';
  categoryId: CategorySubcategoryId | null;
  firstDate: string | null;
  sourceId: string | null;
}

export interface ValidatedSubscriptionFormValues extends SubscriptionFormValues {
  firstDate: string;
  categoryId: CategorySubcategoryId;
}

export type SubscriptionFormType = UseFormReturnType<SubscriptionFormValues>;
