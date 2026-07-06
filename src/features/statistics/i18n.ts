import en from './locales/en/statistics.json' with { type: 'json' };
import ru from './locales/ru/statistics.json' with { type: 'json' };

export const i18nResources = {
  en: { statistics: en },
  ru: { statistics: ru },
} as const;
