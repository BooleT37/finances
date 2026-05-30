import { Group } from '@mantine/core';
import { IconRepeat } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import {
  buildCategorySubcategoryId,
  type CategorySubcategoryId,
} from '~/features/categories/categorySubcategoryId';
import { CategoryIconComp } from '~/features/categories/components/categoryIcons/CategoryIconComp';
import { NameWithOptionalIcon } from '~/features/categories/components/NameWithOptionalIcon';
import { useExpenseCategories } from '~/features/categories/facets/expenseCategories';
import { useIncomeCategories } from '~/features/categories/facets/incomeCategories';
import type { Category } from '~/features/categories/schema';
import { useAvailableSubscriptions } from '~/features/subscriptions/facets/availableSubscriptions';
import type { Subscription } from '~/features/subscriptions/schema';
import type { TreeNode } from '~/shared/components/TreeSelect';

// ── Value tokens ──────────────────────────────────────────────────────────────

const SUBSCRIPTION_PREFIX = 'sub-';

export type ParsedExpenseCategoryValue =
  | CategorySubcategoryId
  | `${typeof SUBSCRIPTION_PREFIX}${number}`;

export function buildSubscriptionValue(
  subscriptionId: number,
): `${typeof SUBSCRIPTION_PREFIX}${number}` {
  return `${SUBSCRIPTION_PREFIX}${subscriptionId}`;
}

export function isSubscriptionValue(
  value: string,
): value is `${typeof SUBSCRIPTION_PREFIX}${number}` {
  return value.startsWith(SUBSCRIPTION_PREFIX);
}

export function parseSubscriptionValue(
  value: `${typeof SUBSCRIPTION_PREFIX}${number}`,
): number {
  return parseInt(value.slice(SUBSCRIPTION_PREFIX.length), 10);
}

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

function categoryToTreeNode(
  category: Category,
  subscriptions: Subscription[],
): TreeNode {
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
    const categories = options.isIncome ? incomeCategories : expenseCategories;
    const pendingSubscriptions = availableSubscriptions
      .filter((a) => a.transactionId === null)
      .map((a) => a.subscription);

    return categories.map((category) =>
      categoryToTreeNode(
        category,
        pendingSubscriptions.filter((s) => s.categoryId === category.id),
      ),
    );
  }, [
    expenseCategories,
    incomeCategories,
    availableSubscriptions,
    options.isIncome,
  ]);
}
