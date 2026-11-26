---
"@tolki/num": minor
---

Locales can now be written the way Laravel writes them, such as `pt_BR`, as well as `pt-BR`, and `ordinal()` follows Laravel's per-locale rules (#137).

- **Breaking:** functions throw an `Error` with Laravel's message for a locale the runtime has no data for, such as `xx`, where they used to format in the host's locale. `spell(42, "xx-XX")` no longer falls back to English. Pass a locale the runtime knows.
- **Breaking:** `ordinal()` follows Laravel's per-locale rules: `ordinal(1, "pt_BR")` is `"1º"`, `ordinal(1, "de")` is `"1."`, negatives use the minus sign `−`, and large numbers are grouped (`"1,000th"`). Update any code or tests that compare against the old English-only output. It now needs `Intl.PluralRules` and `Intl.Locale`, and throws a `TypeError` without them instead of falling back to English.
- **Breaking:** `ordinal()` rounds a fraction as Laravel does (`ordinal(1.5)` is `"2st"`), writes `NaN` and infinity as the locale does (`"NaN"`, `"∞"`), and gives `"-0th"` for `-0`.
- **Breaking:** `spell()` and `spellOrdinal()` use the default locale set by `useLocale()` instead of always English. Pass the locale explicitly to keep English.
- Every function that takes a locale reads `pt_BR` as well as `pt-BR`. `normalizeLocalesUsing()` changes that conversion, and `normalizeLocalesUsing(null)` passes locales to `Intl` unchanged.
- `localeTag()` is exported: it turns `pt_BR` into `pt-BR` for `Intl` and `toLocaleDateString()`, and `normalizeLocalesUsing(localeTag)` restores the default conversion.
