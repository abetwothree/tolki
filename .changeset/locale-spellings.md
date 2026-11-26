---
"@tolki/num": minor
"@tolki/lang": minor
"@tolki/utils": minor
"@tolki/types": minor
---

Locales can now be written the way Laravel writes them, such as `pt_BR`, as well as `pt-BR`, and `ordinal()` in `@tolki/num` follows Laravel's per-locale rules (#137).

- **Breaking:** `@tolki/num` throws an `Error` with Laravel's message for a locale the runtime has no data for, such as `xx`, where it used to format in the host's locale. `spell(42, "xx-XX")` no longer falls back to English. Pass a locale the runtime knows.
- **Breaking:** `ordinal()` follows Laravel's per-locale rules: `ordinal(1, "pt_BR")` is `"1º"`, `ordinal(1, "de")` is `"1."`, negatives use the minus sign `−`, and large numbers are grouped (`"1,000th"`). Update any code or tests that compare against the old English-only output. It now needs `Intl.PluralRules` and `Intl.Locale`, and throws a `TypeError` without them instead of falling back to English.
- **Breaking:** `ordinal()` rounds a fraction as Laravel does (`ordinal(1.5)` is `"2st"`), writes `NaN` and infinity as the locale does (`"NaN"`, `"∞"`), and gives `"-0th"` for `-0`.
- **Breaking:** `spell()` and `spellOrdinal()` use the default locale set by `useLocale()` instead of always English. Pass the locale explicitly to keep English.
- Every `@tolki/num` function that takes a locale reads `pt_BR` as well as `pt-BR`. `normalizeLocalesUsing()` changes that conversion, and `normalizeLocalesUsing(null)` passes locales to `Intl` unchanged.
- `@tolki/lang`: `Translator.normalizeLocalesUsing()` and the `normalizeLocalesUsing` option of `createLang()` opt in to converting every locale a translator is given, for example with `normalizeLocale`. It is off by default, so lookups keep Laravel's exact-key behaviour.
- `@tolki/types` adds `LocaleNormalizer`, the type of a `normalizeLocalesUsing` callback, and `@tolki/lang` exports it.
- `@tolki/lang` and `@tolki/num` both export `localeTag()`, which turns `pt_BR` into `pt-BR` for `Intl` and `toLocaleDateString()`. `normalizeLocalesUsing(localeTag)` restores the default in `@tolki/num`.
- `normalizeLocale()` title-cases script subtags: `zh-hant-tw` gives `zh_Hant_TW`.
