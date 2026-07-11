import en from './locales/en/auth.json' with { type: 'json' };
import ru from './locales/ru/auth.json' with { type: 'json' };

export const i18nResources = {
  en: { auth: en },
  ru: { auth: ru },
} as const;
