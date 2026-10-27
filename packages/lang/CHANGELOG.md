# @tolki/lang

## 0.1.0

### Minor Changes

- 73a813d: New package: Laravel's translator for JavaScript, so a lang string filled in the browser matches the same string filled by Laravel.
  - `Translator` reads a per-locale strings object with `get`, `has`, `choice`, `string` and `array`, including fallback locales and `package::group.key` keys.
  - `makeReplacements` fills `:name`, `:Name` and `:NAME` placeholders and `<tag>` callbacks, longest key first.
  - `choose` and `getPluralIndex` pick a plural form from `{0}` and `[2,*]` ranges or from each locale's plural rules.
  - `normalizeLocale` turns a browser locale such as `en-US` into Laravel's `en_US`.
  - `createHelpers` gives you `__`, `trans` and `transChoice` bound to one translator.

### Patch Changes

- Updated dependencies [eb563dc]
- Updated dependencies [adee162]
- Updated dependencies [40d89eb]
  - @tolki/data@1.0.1
  - @tolki/types@1.10.0
  - @tolki/utils@1.6.1
