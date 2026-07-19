import en from './locales/en/onboarding.json' with { type: 'json' };
import ru from './locales/ru/onboarding.json' with { type: 'json' };

export const i18nResources = {
  en: { onboarding: en },
  ru: { onboarding: ru },
} as const;
