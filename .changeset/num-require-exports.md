---
"@tolki/num": patch
---

`@tolki/num/num` and `@tolki/num/speller` now load in tools that resolve imports with `require` conditions, such as a Vite config that loads as CommonJS. The exports had only an `import` condition, so those tools failed with "This package is ESM only but it was tried to load by `require`".
