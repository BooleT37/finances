import type { UseFormReturnType } from '@mantine/form';
import type { Dayjs } from 'dayjs';

import type { CategorySubcategoryId } from '~/features/categories/categorySubcategoryId';

export interface SubscriptionFormValues {
  name: string;
  cost: string;
  period: '1' | '3' | '6' | '12';
  categoryId: CategorySubcategoryId | null;
  firstDate: Dayjs | null;
  sourceId: string | null;
}

export type SubscriptionFormType = UseFormReturnType<SubscriptionFormValues>;
