# Contributing to @motifx-community/i18n

Thanks for taking the time to help. Bug reports, fixes, tests and documentation improvements are all welcome.

For anything larger than a small fix, please open an issue first so we can agree on the direction before you spend
time on it. Questions and ideas go to the [MotifJS discussions](https://github.com/motifjsdev/motifjs/discussions).

## Setup

Node.js 22 or newer, nothing else: the package has no dependency by path.

```sh
npm ci
npm run dev     # the example app, switching locales live
```

## Checks

`npm run check` is what CI runs: typecheck, `motif-lint`, the tests, the package build and the example build. The
parts on their own:

```sh
npm test
npm run test:watch
npm run typecheck
npm run lint:jsx
```

## Making a change

- Keep a pull request focused on one thing. Two unrelated fixes are easier to review as two pull requests.
- Add a test that fails without your change and passes with it; a message format gets a test per locale it
  concerns.
- Messages are text: a translation is formatted and written as text, never as HTML.
- A locale loads when it is first used; nothing in the package reads a locale it was not asked for.
- A change visible to users gets a line in CHANGELOG.md under "Unreleased".
- Write commit messages as a short summary line in the imperative ("Fix list reorder after splice"), with a body
  that explains why when it is not obvious.

## Reporting bugs

Please use the bug report form and include a minimal reproduction: the smallest component or snippet that shows the
problem, what you expected and what happened instead.

Security issues should not be reported in public issues. See the
[security policy](https://github.com/motifjs-community/.github/blob/main/SECURITY.md).

## Code of conduct

This project follows the [Code of Conduct](https://github.com/motifjs-community/.github/blob/main/CODE_OF_CONDUCT.md). By taking part you agree
to follow it.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE) of this repository.
