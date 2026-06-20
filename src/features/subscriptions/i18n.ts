import en from './locales/en/subscriptions.json' with { type: 'json' };
import ru from './locales/ru/subscriptions.json' with { type: 'json' };

export const i18nResources = {
  en: { subscriptions: en },
  ru: { subscriptions: ru },
} as const;
