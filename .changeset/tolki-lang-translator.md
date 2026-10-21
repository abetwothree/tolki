---
"@tolki/lang": minor
---

New package: Laravel's translator for JavaScript, so a lang string filled in the browser matches the same string filled by Laravel.

- `Translator` reads a per-locale strings object with `get`, `has`, `choice`, `string` and `array`, including fallback locales and `package::group.key` keys.
- `makeReplacements` fills `:name`, `:Name` and `:NAME` placeholders and `<tag>` callbacks, longest key first.
- `choose` and `getPluralIndex` pick a plural form from `{0}` and `[2,*]` ranges or from each locale's plural rules.
- `normalizeLocale` turns a browser locale such as `en-US` into Laravel's `en_US`.
- `createHelpers` gives you `__`, `trans` and `transChoice` bound to one translator.
