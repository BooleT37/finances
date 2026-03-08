import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { getExpenseCategoriesOrderQueryOptions } from '~/features/userSettings/facets/expenseCategoriesOrder';
import { getIncomeCategoriesOrderQueryOptions } from '~/features/userSettings/facets/incomeCategoriesOrder';

import { getCategoryMapQueryOptions } from './categoryMap';

export const sortCategories = (
  category1Id: number,
  category2Id: number,
  order: number[],
) => {
  if (!order.includes(category1Id)) {
    console.error(
      `Sort position not found for category with id ${category1Id}.`,
    );
  }
  if (!order.includes(category2Id)) {
    console.error(
      `Sort position not found for category with id ${category2Id}.`,
    );
  }
  return order.indexOf(category1Id) - order.indexOf(category2Id);
};

export const sortAllCategories = (
  category1Id: number,
  category2Id: number,
  expenseCategoriesOrder: number[],
  incomeCategoriesOrder: number[],
) =>
  sortCategories(category1Id, category2Id, [
    ...expenseCategoriesOrder,
    ...incomeCategoriesOrder,
  ]);

export const useSortAllCategoriesById = () => {
  const { data: expenseOrder } = useQuery(
    getExpenseCategoriesOrderQueryOptions(),
  );
  const { data: incomeOrder } = useQuery(
    getIncomeCategoriesOrderQueryOptions(),
  );

  return useCallback(
    (category1Id: number, category2Id: number) =>
      expenseOrder && incomeOrder
        ? sortAllCategories(category1Id, category2Id, expenseOrder, incomeOrder)
        : 0,
    [expenseOrder, incomeOrder],
  );
};

export const useSortSubcategories = () => {
  const { data: categoryMap } = useQuery(getCategoryMapQueryOptions());

  return useCallback(
    (
      categoryId: number,
      subcategory1Id: number | null,
      subcategory2Id: number | null,
    ) => {
      if (subcategory1Id === null) {
        return 1;
      }
      if (subcategory2Id === null) {
        return -1;
      }
      const subcategories = categoryMap?.[categoryId]?.subcategories ?? [];
      const order = subcategories.map((s) => s.id);
      if (!order.includes(subcategory1Id)) {
        console.error(
          `Sort position not found for subcategory with id ${subcategory1Id}.`,
        );
      }
      if (!order.includes(subcategory2Id)) {
        console.error(
          `Sort position not found for subcategory with id ${subcategory2Id}.`,
        );
      }
      return order.indexOf(subcategory1Id) - order.indexOf(subcategory2Id);
    },
    [categoryMap],
  );
};
