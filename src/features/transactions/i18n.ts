import en from './locales/en/transactions.json' with { type: 'json' };
import ru from './locales/ru/transactions.json' with { type: 'json' };

export const i18nResources = {
  en: { transactions: en },
  ru: { transactions: ru },
} as const;
