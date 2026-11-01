import dayjs from 'dayjs';
import Decimal from 'decimal.js';

import type { Prisma, Subscription } from '~/generated/prisma/client';

import type { ExpenseWithCategory } from './categoryJevQuestion';

const projectId = 'project';

const auditFields = {
  createdAt: dayjs('2026-01-01').toDate(),
  createdById: null,
  updatedAt: dayjs('2026-01-01').toDate(),
  updatedById: null,
};

export const categoryRow = (
  id: number,
  name: string,
  subcategories: { id: number; name: string }[] = [],
  isIncome = false,
): Prisma.CategoryGetPayload<{ include: { subcategories: true } }> => ({
  id,
  name,
  isIncome,
  isContinuous: false,
  shortname: name,
  icon: null,
  type: null,
  projectId,
  ...auditFields,
  subcategories: subcategories.map((subcategory) => ({
    ...subcategory,
    categoryId: id,
    projectId,
    ...auditFields,
  })),
});

export const subscriptionRow = (
  id: number,
  name: string,
  categoryId: number,
  subcategoryId: number | null = null,
): Subscription => ({
  id,
  name,
  cost: new Decimal(10),
  period: 1,
  firstDate: dayjs('2026-01-01').toDate(),
  active: true,
  categoryId,
  subcategoryId,
  sourceId: null,
  projectId,
  ...auditFields,
});

export const expenseRow = ({
  id,
  importedDescription,
  cost,
  date,
  category,
  subcategoryId = null,
  subscriptionId = null,
}: {
  id: number;
  importedDescription: string;
  cost: number;
  date: string;
  category: ReturnType<typeof categoryRow>;
  subcategoryId?: number | null;
  subscriptionId?: number | null;
}): ExpenseWithCategory => ({
  id,
  name: importedDescription,
  cost: new Decimal(cost),
  date: dayjs(date).toDate(),
  actualDate: null,
  categoryId: category.id,
  subcategoryId,
  sourceId: 1,
  subscriptionId,
  savingSpendingCategoryId: null,
  importHash: null,
  importedDescription,
  projectId,
  ...auditFields,
  createdAt: dayjs(date).toDate(),
  category,
});
