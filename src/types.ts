/** A message catalog: strings, or nested objects reached with dotted keys (`'nav.home'`). */
export interface Messages {
  [key: string]: string | Messages;
}

/** Values for `{placeholders}` in a message. */
export type Params = Record<string, unknown>;

/** What `load` may resolve to: the catalog itself or a module whose `default` is the catalog. */
export type LoadResult = Messages | { default: Messages };

export interface I18nOptions {
  /** Starting locale, e.g. `'en'` or `'pt-BR'`. */
  locale: string;
  /** Locale used for keys missing in the active one. Defaults to `locale`. */
  fallback?: string;
  /** Catalogs that are already in memory, by locale. */
  messages?: Record<string, Messages>;
  /**
   * Loads a catalog on demand, typically `(l) => import(`./locales/${l}.json`)`.
   * Called at most once per locale.
   */
  load?: (locale: string) => Promise<LoadResult>;
  /** Named formats for `d()` and `n()`, merged over the built-in ones. */
  formats?: {
    date?: Record<string, Intl.DateTimeFormatOptions>;
    number?: Record<string, Intl.NumberFormatOptions>;
  };
  /** Called when no catalog has the key. Return the text to show; the default shows the key. */
  missing?: (key: string, locale: string) => string | void;
  /** Keep `<html lang dir>` in sync with the locale. Defaults to `true` when `document` exists. */
  dom?: boolean;
}
