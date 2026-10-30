// Languages written right to left. Intl.Locale#textInfo is not everywhere yet, so a short list it is.
const RTL = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'ug', 'yi', 'dv', 'ckb']);

/** `'rtl'` for Arabic, Hebrew, Persian and the other right-to-left languages, `'ltr'` otherwise. */
export function directionOf(locale: string): 'ltr' | 'rtl' {
  return RTL.has(locale.split('-')[0].toLowerCase()) ? 'rtl' : 'ltr';
}
