import en from './locales/en/import.json' with { type: 'json' };
import ru from './locales/ru/import.json' with { type: 'json' };

export const i18nResources = {
  en: { import: en },
  ru: { import: ru },
} as const;
