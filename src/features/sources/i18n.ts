import en from './locales/en/sources.json' with { type: 'json' };
import ru from './locales/ru/sources.json' with { type: 'json' };

export const i18nResources = {
  en: { sources: en },
  ru: { sources: ru },
} as const;
