// Intl objects are slow to build and cheap to reuse; one per (kind, locale, options).
const cache = new Map<string, unknown>();

function memo<T>(kind: string, locale: string, options: object | undefined, make: () => T): T {
  const id = `${kind}|${locale}|${options ? JSON.stringify(options) : ''}`;
  let hit = cache.get(id) as T | undefined;
  if (!hit) cache.set(id, (hit = make()));
  return hit;
}

export const numberFormat = (locale: string, o?: Intl.NumberFormatOptions) =>
  memo('n', locale, o, () => new Intl.NumberFormat(locale, o));
export const dateFormat = (locale: string, o?: Intl.DateTimeFormatOptions) =>
  memo('d', locale, o, () => new Intl.DateTimeFormat(locale, o));
export const pluralRules = (locale: string) => memo('p', locale, undefined, () => new Intl.PluralRules(locale));
export const relativeFormat = (locale: string, o?: Intl.RelativeTimeFormatOptions) =>
  memo('r', locale, o, () => new Intl.RelativeTimeFormat(locale, o));

export const dateStyles: Record<string, Intl.DateTimeFormatOptions> = {
  short: { dateStyle: 'short' },
  medium: { dateStyle: 'medium' },
  long: { dateStyle: 'long' },
  full: { dateStyle: 'full' },
  time: { timeStyle: 'short' },
  datetime: { dateStyle: 'medium', timeStyle: 'short' },
};

export const numberStyles: Record<string, Intl.NumberFormatOptions> = {
  percent: { style: 'percent' },
  compact: { notation: 'compact' },
  integer: { maximumFractionDigits: 0 },
};

export type RelativeUnit = Intl.RelativeTimeFormatUnit;

const STEPS: [RelativeUnit, number][] = [
  ['year', 31536e6],
  ['month', 2592e6],
  ['day', 864e5],
  ['hour', 36e5],
  ['minute', 6e4],
  ['second', 1e3],
];

/** Picks the largest unit that fits the distance from `now` to `date`. */
export function relativeParts(date: Date, now: number): [number, RelativeUnit] {
  const diff = date.getTime() - now;
  for (const [unit, ms] of STEPS) {
    if (Math.abs(diff) >= ms || unit === 'second') return [Math.round(diff / ms), unit];
  }
  return [0, 'second'];
}
