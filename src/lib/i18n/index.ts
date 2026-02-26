import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { i18nResources as navResources } from '~/features/nav/i18n';
import { i18nResources as transactionsResources } from '~/features/transactions/i18n';

import homeEn from './locales/en/home.json';
import homeRu from './locales/ru/home.json';

export const resources = {
  en: { home: homeEn, ...navResources.en, ...transactionsResources.en },
  ru: { home: homeRu, ...navResources.ru, ...transactionsResources.ru },
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
