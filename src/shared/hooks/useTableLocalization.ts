import { MRT_Localization_EN } from 'mantine-react-table-open/locales/en/index.cjs';
import { MRT_Localization_RU } from 'mantine-react-table-open/locales/ru/index.cjs';
import { useTranslation } from 'react-i18next';

const localizationMap = {
  en: MRT_Localization_EN,
  ru: MRT_Localization_RU,
} as const;

type SupportedLocale = keyof typeof localizationMap;

function isSupportedLocale(lang: string): lang is SupportedLocale {
  return lang in localizationMap;
}

export function useTableLocalization() {
  const { i18n } = useTranslation();
  const lang = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  return localizationMap[lang];
}
