import en from './locales/en/project.json' with { type: 'json' };
import ru from './locales/ru/project.json' with { type: 'json' };

export const i18nResources = {
  en: { project: en },
  ru: { project: ru },
} as const;
