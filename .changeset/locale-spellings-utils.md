---
"@tolki/utils": minor
---

Adds the locale spelling helpers `localeTag()` and `normalizeLocale()`, which moved here from `@tolki/lang` (#137).

- `localeTag()` turns `pt_BR` into `pt-BR` for `Intl`, and never throws.
- `normalizeLocale()` title-cases script subtags: `zh-hant-tw` gives `zh_Hant_TW`.
