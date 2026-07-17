import en from './locales/en/account.json' with { type: 'json' };
import ru from './locales/ru/account.json' with { type: 'json' };

export const i18nResources = {
  en: { account: en },
  ru: { account: ru },
} as const;
