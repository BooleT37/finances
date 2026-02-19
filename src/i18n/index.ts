import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import homeEn from './locales/en/home'
import homeRu from './locales/ru/home'

export const resources = {
  en: {
    home: homeEn,
  },
  ru: {
    home: homeRu,
  },
} as const

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'home'
    resources: (typeof resources)['ru']
  }
}

i18n.use(initReactI18next).init({
  lng: 'ru',
  defaultNS: 'home',
  resources,
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
