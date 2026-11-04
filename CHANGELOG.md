# Changelog

All notable changes to this package are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the package uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0-beta.0] - 2026-10-30

The first preview.

- `createI18n` and `I18n`: catalogs (nested, dotted keys), a fallback locale, catalogs loaded on first use, named
  date and number formats, a `missing` hook, `<html lang dir>` kept in step.
- `t` with an ICU subset: placeholders, `plural` (with `#` and `=n`), `select`, `number`; `d`, `n`, `rt` with `Intl`.
- `onLocaleChanged` for code that draws by hand; `locale`, `dir`, `loading` read reactively.
- `Trans` for components inside a sentence; `format` and `directionOf` on their own.
- The `motifjs-i18n keys` command writes a key union for typed `t`.
