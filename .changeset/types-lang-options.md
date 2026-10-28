---
"@tolki/types": minor
---

Adds the types that `createLang()` in `@tolki/lang` takes.

- `LangOptions` describes what `createLang()` is built from: a locale, a fallback, lines you already have and a `load` function.
- `LocaleLinesLoader` is the type of that `load` function, and `LocaleModule` is what `import()` answers for a locale's JSON file.
