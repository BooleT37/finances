import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Builds the display name for a transaction component, combining the
 * component's own name with its parent transaction's name. Shared so the
 * transactions table and the budgeting hover list name components identically.
 */
export function useFormatComponentName(): (
  component: { name: string },
  parent: { name: string },
) => string {
  const { t } = useTranslation('transactions');
  return useCallback(
    (component, parent) => {
      if (component.name && parent.name) {
        return t('componentWithParent', {
          componentName: component.name,
          parentName: parent.name,
        });
      }
      if (component.name) {
        return component.name;
      }
      if (parent.name) {
        return t('componentOfExpense', { name: parent.name });
      }
      return '';
    },
    [t],
  );
}
