import en from './locales/en/projectUsers.json' with { type: 'json' };
import ru from './locales/ru/projectUsers.json' with { type: 'json' };

export const i18nResources = {
  en: { projectUsers: en },
  ru: { projectUsers: ru },
} as const;
