---
"@tolki/types": minor
---

Adds the translation types `@tolki/lang` uses and a type for dot paths, so packages can share them.

- `LangLines`, `LangGroup`, `Replacements`, `TranslationKey`, `TranslationResult` and the other `@tolki/lang` types now live here, also importable from `@tolki/types/lang`, and `@tolki/lang` still exports them.
- `@tolki/lang`'s `Countable` type is `LangCountable` here, because `Countable` already names the PHP interface.
- `ObjectDotPath<T>` lists every dot path into an object or a list, up to 10 levels deep, and stops at a value with methods such as a DOM node. `ObjectDotPathValue<T, P>` reads the value at one.
- `ObjectResolvePath` reads a tuple member exactly: `"list.0"` on `[{ a: string }, string]` is now `{ a: string }`.
