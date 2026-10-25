import en from './locales/en/projectSettings.json' with { type: 'json' };
import ru from './locales/ru/projectSettings.json' with { type: 'json' };

export const i18nResources = {
  en: { projectSettings: en },
  ru: { projectSettings: ru },
} as const;
