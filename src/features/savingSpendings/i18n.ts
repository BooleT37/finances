import en from './locales/en/savingSpendings.json' with { type: 'json' };
import ru from './locales/ru/savingSpendings.json' with { type: 'json' };

export const i18nResources = {
  en: { savingSpendings: en },
  ru: { savingSpendings: ru },
} as const;
