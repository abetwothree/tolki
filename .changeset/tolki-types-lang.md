---
"@tolki/types": minor
---

Adds the translation types `@tolki/lang` uses and a type for dot paths, so packages can share them.

- `LangLines`, `LangGroup`, `Replacements`, `TranslationKey`, `TranslationResult` and the other `@tolki/lang` types now live here, and `@tolki/lang` still exports them.
- `ObjectDotPath<T>` lists every dot path into an object or a list.
- `ObjectResolvePath` reads a tuple member exactly: `"list.0"` on `[{ a: string }, string]` is now `{ a: string }`.
