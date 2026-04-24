import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { i18nResources as budgetingResources } from '~/features/budgeting/i18n';
import { i18nResources as categoriesResources } from '~/features/categories/i18n';
import { i18nResources as navResources } from '~/features/nav/i18n';
import { i18nResources as savingSpendingsResources } from '~/features/savingSpendings/i18n';
import { i18nResources as sourcesResources } from '~/features/sources/i18n';
import { i18nResources as transactionsResources } from '~/features/transactions/i18n';

import commonEn from './locales/en/common.json';
import homeEn from './locales/en/home.json';
import commonRu from './locales/ru/common.json';
import homeRu from './locales/ru/home.json';

export const resources = {
  en: {
    common: commonEn,
    home: homeEn,
    ...navResources.en,
    ...transactionsResources.en,
    ...budgetingResources.en,
    ...savingSpendingsResources.en,
    ...categoriesResources.en,
    ...sourcesResources.en,
  },
  ru: {
    common: commonRu,
    home: homeRu,
    ...navResources.ru,
    ...transactionsResources.ru,
    ...budgetingResources.ru,
    ...savingSpendingsResources.ru,
    ...categoriesResources.ru,
    ...sourcesResources.ru,
  },
} as const;

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'home';
    resources: (typeof resources)['ru'];
  }
}

i18n.use(initReactI18next).init({
  lng: 'ru',
  defaultNS: 'home',
  resources,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
