import navEn from './locales/en/nav.json' with { type: 'json' };
import navRu from './locales/ru/nav.json' with { type: 'json' };

export const i18nResources = {
  en: { nav: navEn },
  ru: { nav: navRu },
} as const;
