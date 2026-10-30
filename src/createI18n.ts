import { Emitter, reactive, type Event as MotifEvent } from '@motifx/core';
import { directionOf } from './dir';
import { format } from './format/icu';
import {
  dateFormat,
  dateStyles,
  numberFormat,
  numberStyles,
  relativeFormat,
  relativeParts,
  type RelativeUnit,
} from './format/intl';
import type { I18nOptions, LoadResult, Messages, Params } from './types';

function find(catalog: Messages, key: string): string | undefined {
  const flat = catalog[key];
  if (typeof flat === 'string') return flat;
  let node: string | Messages | undefined = catalog;
  for (const part of key.split('.')) {
    node = typeof node === 'object' ? node[part] : undefined;
  }
  return typeof node === 'string' ? node : undefined;
}

/**
 * The translation state of one application: the active locale, the loaded catalogs and the
 * formatters. Build it with {@link createI18n}; `t`, `d`, `n` and `rt` are plain functions
 * and safe to destructure, but only a call made inside a getter (`{() => t('hi')}`) stays live.
 * `K` narrows the accepted keys, see `npx motifjs-i18n keys`.
 *
 * @example
 * const { t, setLocale } = createI18n({ locale: 'en', messages: { en: { hi: 'Hi {name}' } } });
 * <h1>{() => t('hi', { name: 'Ada' })}</h1>
 */
export class I18n<K extends string = string> {
  private state: { locale: string; rev: number; loading: number };
  private catalogs = new Map<string, Messages>();
  private pending = new Map<string, Promise<void>>();
  private seq = 0;
  private options: I18nOptions;
  private readonly changed = new Emitter<{ locale: string; previous: string }>();

  /** Resolves once the starting locale and the fallback are loaded. */
  readonly ready: Promise<void>;

  constructor(options: I18nOptions) {
    this.options = options;
    this.state = reactive({ locale: options.locale, rev: 0, loading: 0 });
    for (const [locale, messages] of Object.entries(options.messages ?? {})) this.catalogs.set(locale, messages);
    this.syncDom();
    this.ready = Promise.all([this.ensure(options.locale), this.ensure(this.fallback)]).then(() => {});
    this.ready.catch(() => {}); // a failed first load is reported to whoever awaits `ready`, not as unhandled
  }

  /** The active locale. Reading it inside a getter makes the getter follow locale changes. */
  get locale(): string {
    return this.state.locale;
  }

  /**
   * Raised once the locale changed (after its catalog arrived), for code that draws by hand instead of following
   * `locale`: a UI kit, a canvas, a third-party widget.
   *
   * @example
   * i18n.onLocaleChanged(({ locale }) => chart.setLocale(locale));
   */
  get onLocaleChanged(): MotifEvent<{ locale: string; previous: string }> {
    return this.changed.event;
  }

  /** `'rtl'` or `'ltr'` for the active locale. Reactive. */
  get dir(): 'ltr' | 'rtl' {
    return directionOf(this.state.locale);
  }

  /** `true` while a locale file is being loaded. Reactive. */
  get loading(): boolean {
    return this.state.loading > 0;
  }

  private get fallback(): string {
    return this.options.fallback ?? this.options.locale;
  }

  /**
   * Switches the locale. A locale that is not loaded yet is fetched first and the switch happens
   * when it arrives, so the page never flashes fallback text. If `setLocale` is called again
   * before that, the earlier call is dropped. Rejects when the load fails; the old locale stays.
   *
   * @example
   * <button onclick={() => setLocale('tr')}>Türkçe</button>
   */
  setLocale = async (locale: string): Promise<void> => {
    const turn = ++this.seq;
    await this.ensure(locale);
    if (turn !== this.seq) return;
    const previous = this.state.locale;
    this.state.locale = locale;
    this.syncDom();
    if (previous !== locale) this.changed.fire({ locale, previous });
  };

  /** Adds or replaces the catalog of a locale and refreshes every bound text. */
  setMessages = (locale: string, messages: Messages): void => {
    this.catalogs.set(locale, messages);
    this.state.rev++;
  };

  /**
   * Translates `key`, looking in the active locale, its base language (`pt-BR` then `pt`) and the
   * fallback. A key found nowhere gives back the key (or what `missing` returns).
   *
   * @example
   * t('cart.items', { count: 3 }) // "3 items"
   */
  t = (key: K, params?: Params): string => {
    const locale = this.state.locale;
    void this.state.rev; // a catalog arriving later re-runs bound getters
    for (const l of this.chain(locale)) {
      const catalog = this.catalogs.get(l);
      const message = catalog && find(catalog, key);
      if (message === undefined) continue;
      return /[{']/.test(message) ? format(message, l, params) : message;
    }
    return this.options.missing?.(key, locale) ?? key;
  };

  /**
   * Formats a date with `Intl.DateTimeFormat`. `style` is a preset (`short`, `medium`, `long`,
   * `full`, `time`, `datetime`), a name from `options.formats.date` or an Intl options object.
   *
   * @example
   * d(new Date(), 'long')
   */
  d = (date: Date | number, style: string | Intl.DateTimeFormatOptions = 'medium'): string => {
    const options = typeof style === 'string' ? (this.options.formats?.date?.[style] ?? dateStyles[style]) : style;
    return dateFormat(this.state.locale, options).format(date);
  };

  /**
   * Formats a number with `Intl.NumberFormat`. `style` is a preset (`percent`, `compact`,
   * `integer`), a name from `options.formats.number` or an Intl options object.
   *
   * @example
   * n(0.256, 'percent') // "26%"
   */
  n = (value: number | bigint, style?: string | Intl.NumberFormatOptions): string => {
    const options = typeof style === 'string' ? (this.options.formats?.number?.[style] ?? numberStyles[style]) : style;
    return numberFormat(this.state.locale, options).format(value);
  };

  /**
   * Formats a relative time with `Intl.RelativeTimeFormat`: `rt(-3, 'day')` is "3 days ago".
   * Given a `Date` it picks the unit itself, measured from now.
   *
   * @example
   * rt(new Date(Date.now() - 3600_000)) // "1 hour ago"
   */
  rt = (value: number | Date, unit?: RelativeUnit): string => {
    const [amount, u] = value instanceof Date ? relativeParts(value, Date.now()) : [value, unit ?? 'day'];
    return relativeFormat(this.state.locale, { numeric: 'auto' }).format(amount, u);
  };

  /** `pt-BR` -> [`pt-BR`, `pt`, fallback, fallback base], without repeats. */
  private chain(locale: string): string[] {
    const out = [locale, locale.split('-')[0], this.fallback, this.fallback.split('-')[0]];
    return out.filter((l, i) => out.indexOf(l) === i);
  }

  private ensure(locale: string): Promise<void> {
    const load = this.options.load;
    if (this.catalogs.has(locale) || !load) return Promise.resolve();
    let job = this.pending.get(locale);
    if (!job) {
      this.state.loading++;
      job = Promise.resolve()
        .then(() => load(locale))
        .then((result: LoadResult) => {
          this.catalogs.set(locale, 'default' in result && typeof result.default === 'object' ? (result.default as Messages) : (result as Messages));
          this.state.rev++;
        })
        .finally(() => {
          this.pending.delete(locale);
          this.state.loading--;
        });
      this.pending.set(locale, job);
    }
    return job;
  }

  private syncDom() {
    if (this.options.dom === false || typeof document === 'undefined') return;
    const root = document.documentElement;
    root.lang = this.state.locale;
    root.dir = directionOf(this.state.locale);
  }
}

/**
 * Creates the translation state. Do it once in a module and import the result where texts are
 * written, or register it in DI (`addSingleton(I18n, { useValue: i18n })`) so `<Trans>` finds it.
 *
 * @example
 * export const i18n = createI18n({
 *   locale: 'en',
 *   fallback: 'en',
 *   load: (l) => import(`./locales/${l}.json`),
 * });
 */
export function createI18n<K extends string = string>(options: I18nOptions): I18n<K> {
  return new I18n<K>(options);
}
