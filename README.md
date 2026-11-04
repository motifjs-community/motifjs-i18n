# @motifx-community/i18n

[![npm](https://img.shields.io/npm/v/@motifx-community/i18n/beta?label=npm%20%40beta)](https://www.npmjs.com/package/@motifx-community/i18n)
[![CI](https://github.com/motifjs-community/motifjs-i18n/actions/workflows/ci.yml/badge.svg)](https://github.com/motifjs-community/motifjs-i18n/actions/workflows/ci.yml)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Translations for **MotifJS** (`@motifx/core`) apps: message catalogs with an ICU subset (placeholders, plurals,
`select`, numbers), locales loaded when first used, `Intl` formatting of dates, numbers and relative times, and the
page's `lang` and `dir` kept in step. A text bound in a getter follows the locale live.

> **Preview** (`beta`): usable, and its API may still change before 1.0.

[Live demo](https://motifjs-community.github.io/motifjs-i18n/) · the package carries its docs for readers that are not a browser: [`llms.txt`](llms.txt).

## Install

```sh
npm i @motifx/core@next @motifx-community/i18n@beta
```

## Use

```tsx
import { createI18n } from '@motifx-community/i18n';

const i18n = createI18n({
  locale: 'en',
  fallback: 'en',
  messages: { en: { hello: 'Hello {name}', items: '{count, plural, one {# item} other {# items}}' } },
  load: (locale) => import(`./locales/${locale}.json`), // other locales, when first used
});
const { t, d, n, rt, setLocale } = i18n;

<h1>{() => t('hello', { name: 'Ada' })}</h1>      // a getter follows the locale
<p>{() => t('items', { count: cart.size })}</p>
<p>{() => d(order.date, 'long')} · {() => n(order.total, { style: 'currency', currency: 'EUR' })}</p>

await setLocale('tr'); // loads tr.json, then every bound text is written again
```

| Member | What it does |
| --- | --- |
| `t(key, params?)` | The message of `key` (dotted keys reach nested catalogs), its ICU parts filled in. |
| `d(date, style?)` | A date by a named style (`short`, `medium`, `long`, `full`) or `Intl.DateTimeFormatOptions`. |
| `n(value, style?)` | A number by a named style (`percent`, `compact`, …) or `Intl.NumberFormatOptions`. |
| `rt(value, unit?)` | A relative time ("3 days ago"); given a `Date`, the unit is chosen. |
| `setLocale(locale)` | Switches the locale, loading its catalog (and `pt` for `pt-BR`) once. |
| `setMessages(locale, messages)` | Adds or replaces a catalog. |
| `locale`, `dir`, `loading` | The active locale, `'ltr'` or `'rtl'`, whether a catalog is loading. Reactive. |
| `onLocaleChanged` | An event after the locale changed (`{ locale, previous }`), for code that draws by hand. |
| `ready` | Resolves once the starting locale and the fallback are loaded. |

- `format(message, locale, values)` formats one ICU message without a catalog.
- `directionOf(locale)` is `'rtl'` for right-to-left languages.
- `<Trans k="terms" slots={{ link: (text) => <a href="/terms">{text}</a> }} />` puts components inside a sentence
  (`"I accept the <link>terms</link>"`).
- `npx motifjs-i18n keys locales/en.json src/keys.d.ts` writes a `MessageKey` union; `createI18n<MessageKey>(…)` then
  checks every key.

With `@motifx-community/ui`, `connectI18n(i18n)` keeps the kit's own texts on the app's language.

## Contributing

`npm ci`, then `npm run check` (typecheck, `motif-lint`, tests, build, example build). The setup, the checks and the
rules a change follows are in [CONTRIBUTING.md](CONTRIBUTING.md). Questions and ideas go to the
[MotifJS discussions](https://github.com/motifjsdev/motifjs/discussions).

## License

[MIT](LICENSE)
