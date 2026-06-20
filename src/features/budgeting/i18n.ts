import en from './locales/en/budgeting.json' with { type: 'json' };
import ru from './locales/ru/budgeting.json' with { type: 'json' };

export const i18nResources = {
  en: { budgeting: en },
  ru: { budgeting: ru },
} as const;
