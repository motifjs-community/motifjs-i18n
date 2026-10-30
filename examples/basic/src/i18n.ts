import { createI18n } from '@motifx-community/i18n';
import type { MessageKey } from './keys';

export const locales = [
  { code: 'en', label: 'English' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'ar', label: 'العربية' },
];

// One instance for the whole app, imported where texts are written. Locale files load on demand.
export const i18n = createI18n<MessageKey>({
  locale: 'en',
  fallback: 'en',
  load: (locale) => import(`./locales/${locale}.json`),
  formats: { number: { price: { style: 'currency', currency: 'EUR' } } },
});

export const { t, d, n, rt, setLocale } = i18n;
