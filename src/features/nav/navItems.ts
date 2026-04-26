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
} from '@tabler/icons-react';

import type { i18nResources } from './i18n';

export type NavLabelKey = keyof (typeof i18nResources)['ru']['nav'];

export interface NavItem {
  to: string;
  labelKey: NavLabelKey;
  icon: Icon;
  children?: NavItem[];
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
    children: [
      { to: '/settings/categories', labelKey: 'categories', icon: IconTag },
      { to: '/settings/sources', labelKey: 'sources', icon: IconCreditCard },
      {
        to: '/settings/subscriptions',
        labelKey: 'subscriptions',
        icon: IconRepeat,
      },
    ],
  },
];

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
