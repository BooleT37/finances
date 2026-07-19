import {
  type Icon,
  IconBuildingBank,
  IconCalendar,
  IconChartLine,
  IconCreditCard,
  IconRepeat,
  IconSettings,
  IconTable,
  IconTag,
  IconUser,
  IconUsers,
} from '@tabler/icons-react';

import type { i18nResources } from '../../i18n';

type NavResources = (typeof i18nResources)['ru']['nav'];
export type NavLabelKey = {
  [K in keyof NavResources]: NavResources[K] extends string ? K : never;
}[keyof NavResources];

export interface NavItem {
  to: string;
  labelKey: NavLabelKey;
  icon: Icon;
  children?: NavItem[];
  adminOnly?: boolean;
  /** Onboarding tour target id, when this item is highlighted by the nav tour. */
  tourId?: string;
}

export const navItems: NavItem[] = [
  { to: '/transactions', labelKey: 'transactions', icon: IconTable },
  { to: '/budgeting', labelKey: 'planning', icon: IconCalendar },
  {
    to: '/savings-spendings',
    labelKey: 'savings',
    icon: IconBuildingBank,
  },
  { to: '/statistics', labelKey: 'statistics', icon: IconChartLine },
  {
    to: '/settings',
    labelKey: 'settings',
    icon: IconSettings,
    tourId: 'onboarding-settings',
    children: [
      {
        to: '/settings/categories',
        labelKey: 'categories',
        icon: IconTag,
        tourId: 'onboarding-categories',
      },
      {
        to: '/settings/sources',
        labelKey: 'sources',
        icon: IconCreditCard,
        tourId: 'onboarding-sources',
      },
      {
        to: '/settings/subscriptions',
        labelKey: 'subscriptions',
        icon: IconRepeat,
        tourId: 'onboarding-subscriptions',
      },
      { to: '/settings/project', labelKey: 'project', icon: IconUsers },
      { to: '/settings/account', labelKey: 'account', icon: IconUser },
    ],
  },
];

export function filterNavItems(items: NavItem[], isAdmin: boolean): NavItem[] {
  return items
    .filter((item) => !item.adminOnly || isAdmin)
    .map((item) =>
      item.children
        ? { ...item, children: filterNavItems(item.children, isAdmin) }
        : item,
    );
}

export function findBreadcrumbTrail(
  pathname: string,
  items: NavItem[] = navItems,
): NavItem[] {
  for (const item of items) {
    if (item.to === pathname) {
      return [item];
    }
    if (item.children) {
      const childTrail = findBreadcrumbTrail(pathname, item.children);
      if (childTrail.length > 0) {
        return [item, ...childTrail];
      }
    }
  }
  return [];
}
