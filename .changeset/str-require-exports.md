---
"@tolki/str": patch
---

The `@tolki/str` subpaths `ascii`, `base64`, `convertcase`, `markdown`, `pluralizer`, `random`, `replacer`, `str`, `stringable`, `transliterate`, `trimmer`, `ulid` and `uuid` now load in tools that resolve imports with `require` conditions, such as a Vite config that loads as CommonJS. The exports had only an `import` condition, so those tools failed with "This package is ESM only but it was tried to load by `require`".
