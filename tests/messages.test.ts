import { describe, expect, it, vi } from 'vitest';
import { createI18n } from '../src';

const en = {
  hi: 'Hello {name}',
  nav: { home: 'Home' },
  'flat.key': 'Flat',
  only: 'Only in English',
  quote: "It''s '{'literal'}' {n, number}",
  cart: '{count, plural, =0 {Empty} one {# item} other {# items}}',
  who: '{g, select, f {She} m {He} other {They}} replied',
  cats: '{n, plural, zero {Z} one {O} two {T} few {F} many {M} other {X}}',
};

describe('lookup and fallback', () => {
  const i18n = createI18n({ locale: 'pt-BR', fallback: 'en', messages: { en, pt: { hi: 'Olá {name}' }, 'pt-BR': { nav: { home: 'Início' } } } });

  it('walks locale, base language, fallback; supports dotted and flat keys', () => {
    expect(i18n.t('nav.home')).toBe('Início');
    expect(i18n.t('hi', { name: 'Ana' })).toBe('Olá Ana');
    expect(i18n.t('only')).toBe('Only in English');
    expect(i18n.t('flat.key')).toBe('Flat');
  });

  it('shows the key for a missing one, or what `missing` returns', () => {
    expect(i18n.t('nope')).toBe('nope');
    const missing = vi.fn(() => '??');
    expect(createI18n({ locale: 'en', messages: { en }, missing }).t('nope')).toBe('??');
    expect(missing).toHaveBeenCalledWith('nope', 'en');
  });
});

describe('messages', () => {
  const t = createI18n({ locale: 'en', messages: { en } }).t;

  it('interpolates, leaves unknown placeholders visible, handles quotes and numbers', () => {
    expect(t('hi', { name: 'Ada' })).toBe('Hello Ada');
    expect(t('hi')).toBe('Hello {name}');
    expect(t('quote', { n: 1234.5 })).toBe("It's {literal} 1,234.5");
  });

  it('plural with exact match and #, and select', () => {
    expect(t('cart', { count: 0 })).toBe('Empty');
    expect(t('cart', { count: 1 })).toBe('1 item');
    expect(t('cart', { count: 1200 })).toBe('1,200 items');
    expect(t('who', { g: 'f' })).toBe('She replied');
    expect(t('who', { g: 'x' })).toBe('They replied');
  });

  it('uses the plural categories of each language', () => {
    const cat = (locale: string, n: number) => createI18n({ locale, messages: { [locale]: en } }).t('cats', { n });
    expect([0, 1, 2, 3, 11, 100].map((n) => cat('ar', n))).toEqual(['Z', 'O', 'T', 'F', 'M', 'X']);
    expect([1, 2, 5, 1.5].map((n) => cat('ru', n))).toEqual(['O', 'F', 'M', 'X']);
    expect([1, 2].map((n) => cat('en', n))).toEqual(['O', 'X']);
    expect([1, 2].map((n) => cat('tr', n))).toEqual(['O', 'X']);
  });
});

describe('Intl formatting', () => {
  it('formats dates, numbers and relative time for the active locale', async () => {
    const i18n = createI18n({ locale: 'en', messages: { en: {}, tr: {} } });
    const date = new Date(Date.UTC(2026, 0, 5, 12));
    expect(i18n.d(date, { dateStyle: 'long', timeZone: 'UTC' })).toBe('January 5, 2026');
    expect(i18n.n(1234.5)).toBe('1,234.5');
    expect(i18n.n(0.256, 'percent')).toBe('26%');
    expect(i18n.rt(-3, 'day')).toBe('3 days ago');
    expect(i18n.rt(new Date(Date.now() - 2 * 3600_000))).toBe('2 hours ago');
    await i18n.setLocale('tr');
    expect(i18n.d(date, { dateStyle: 'long', timeZone: 'UTC' })).toBe('5 Ocak 2026');
    expect(i18n.n(1234.5)).toBe('1.234,5');
    expect(i18n.rt(-3, 'day')).toBe('3 gün önce');
  });
});

describe('locale changed event', () => {
  it('tells once the new locale is in, with the one before; not for the same locale', async () => {
    const i18n = createI18n({ locale: 'en', messages: { en: {}, tr: {} } });
    const seen: string[] = [];
    i18n.onLocaleChanged(({ locale, previous }) => seen.push(`${previous}>${locale}:${i18n.locale}`));
    await i18n.setLocale('tr');
    await i18n.setLocale('tr');
    await i18n.setLocale('en');
    expect(seen).toEqual(['en>tr:tr', 'tr>en:en']);
  });
});

describe('lazy loading', () => {
  it('loads once, shows the fallback until ready, keeps the old locale on failure', async () => {
    let release!: () => void;
    const load = vi.fn((l: string) =>
      l === 'bad'
        ? Promise.reject(new Error('404'))
        : new Promise<{ default: object }>((r) => (release = () => r({ default: { hi: `hi-${l}` } }))),
    );
    const i18n = createI18n({ locale: 'en', fallback: 'en', messages: { en: { hi: 'hi-en', only: 'x' } }, load });
    await i18n.ready;
    expect(load).not.toHaveBeenCalled();

    const switching = i18n.setLocale('de');
    void i18n.setLocale('de');
    expect(i18n.loading).toBe(true);
    expect(i18n.locale).toBe('en'); // still the old locale while loading
    await new Promise((r) => setTimeout(r, 0));
    release();
    await switching;
    expect(load).toHaveBeenCalledTimes(1);
    expect(i18n.locale).toBe('de');
    expect(i18n.t('hi')).toBe('hi-de');
    expect(i18n.t('only')).toBe('x'); // missing in de, found in fallback
    expect(i18n.loading).toBe(false);

    await expect(i18n.setLocale('bad')).rejects.toThrow('404');
    expect(i18n.locale).toBe('de');
  });
});
