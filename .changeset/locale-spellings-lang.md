---
"@tolki/lang": minor
---

A translator can now opt in to converting the locales it is given, so `pt-BR` and `pt_BR` find the same translations (#137).

- `Translator.normalizeLocalesUsing()` and the `normalizeLocalesUsing` option of `createLang()` convert every locale a translator is given, for example with `normalizeLocale`. It is off by default, so lookups keep Laravel's exact-key behaviour.
- `LocaleNormalizer`, the type of a `normalizeLocalesUsing` callback, is exported.
- `localeTag()` is exported: it turns `pt_BR` into `pt-BR` for `Intl` and `toLocaleDateString()`.
- `normalizeLocale()` title-cases script subtags: `zh-hant-tw` gives `zh_Hant_TW`.
