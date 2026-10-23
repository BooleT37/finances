import { Group } from '@mantine/core';
import { IconRepeat } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { buildCategorySubcategoryId } from '~/features/categories/categorySubcategoryId';
import { CategoryIconComp } from '~/features/categories/components/categoryIcons/CategoryIconComp';
import { NameWithOptionalIcon } from '~/features/categories/components/NameWithOptionalIcon';
import { useExpenseCategories } from '~/features/categories/facets/expenseCategories';
import { useIncomeCategories } from '~/features/categories/facets/incomeCategories';
import type { Category } from '~/features/categories/schema';
import { useAvailableSubscriptions } from '~/features/subscriptions/facets/availableSubscriptions';
import type { Subscription } from '~/features/subscriptions/schema';
import {
  groupParsedExpenseCategoryOptions,
  type ParsedExpenseCategoryGroup,
} from '~/features/transactions/parsedExpenseCategoryOptions';
import { buildSubscriptionValue } from '~/features/transactions/parsedExpenseCategoryValue';
import type { TreeNode } from '~/shared/components/TreeSelect';

// ── Renderers ─────────────────────────────────────────────────────────────────

function renderSelection(icons: ReactNode, text: string): ReactNode {
  return (
    <Group gap={4} style={{ display: 'inline-flex', flexWrap: 'nowrap' }}>
      {icons}
      <span>{text}</span>
    </Group>
  );
}

function subscriptionDropdownTitle(name: string): ReactNode {
  return (
    <Group gap={4} style={{ display: 'inline-flex', flexWrap: 'nowrap' }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '1.25em',
          height: '1.25em',
          flexShrink: 0,
        }}
      >
        <IconRepeat size={14} />
      </span>
      <span>{name}</span>
    </Group>
  );
}

// ── Tree builder ────────────────────────────────────────────────────────────

function subscriptionNode(
  category: Category,
  subscription: Subscription,
): TreeNode {
  return {
    value: buildSubscriptionValue(subscription.id),
    title: subscriptionDropdownTitle(subscription.name),
    searchValue: `${category.name} ${subscription.name}`,
    selectionTitle: renderSelection(
      <>
        {category.icon ? <CategoryIconComp value={category.icon} /> : null}
        <IconRepeat size={14} />
      </>,
      subscription.name,
    ),
  };
}

function categoryToTreeNode({
  category,
  subscriptions,
}: ParsedExpenseCategoryGroup<Category, Subscription>): TreeNode {
  const categoryIcon = category.icon ? (
    <CategoryIconComp value={category.icon} />
  ) : null;

  const subcategoryNodes: TreeNode[] = category.subcategories.map((sub) => {
    const subSubscriptions = subscriptions.filter(
      (s) => s.subcategoryId === sub.id,
    );
    return {
      value: buildCategorySubcategoryId({
        categoryId: category.id,
        subcategoryId: sub.id,
      }),
      title: <NameWithOptionalIcon name={sub.name} reserveIconSpace />,
      searchValue: `${category.name} ${sub.name}`,
      selectionTitle: renderSelection(
        categoryIcon,
        `${category.name} - ${sub.name}`,
      ),
      children: subSubscriptions.map((s) => subscriptionNode(category, s)),
    };
  });

  const categorySubscriptionNodes: TreeNode[] = subscriptions
    .filter((s) => s.subcategoryId === null)
    .map((s) => subscriptionNode(category, s));

  const children = [...subcategoryNodes, ...categorySubscriptionNodes];

  return {
    value: buildCategorySubcategoryId({ categoryId: category.id }),
    title: (
      <NameWithOptionalIcon
        name={category.name}
        icon={category.icon}
        reserveIconSpace
      />
    ),
    searchValue: category.name,
    selectionTitle: renderSelection(categoryIcon, category.name),
    ...(children.length > 0 ? { children } : {}),
  };
}

export function useParsedExpenseCategoryTree(options: {
  isIncome: boolean;
}): TreeNode[] | undefined {
  const expenseCategories = useExpenseCategories();
  const incomeCategories = useIncomeCategories();
  const availableSubscriptions = useAvailableSubscriptions();

  return useMemo(() => {
    if (!expenseCategories || !incomeCategories || !availableSubscriptions) {
      return undefined;
    }
    const pendingSubscriptions = availableSubscriptions
      .filter((a) => a.transactionId === null)
      .map((a) => a.subscription);

    return groupParsedExpenseCategoryOptions({
      categories: options.isIncome ? incomeCategories : expenseCategories,
      subscriptions: pendingSubscriptions,
      isIncome: options.isIncome,
    }).map(categoryToTreeNode);
  }, [
    expenseCategories,
    incomeCategories,
    availableSubscriptions,
    options.isIncome,
  ]);
}
