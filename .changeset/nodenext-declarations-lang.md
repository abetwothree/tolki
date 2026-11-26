---
"@tolki/lang": patch
---

Fixes type errors in projects that use `moduleResolution` `node16` or `nodenext`: the published declaration files now name every file they import, so every export resolves (#143). Each export in `package.json` also lists its types first.

- `@types/react` is now an optional peer dependency, for apps that use `@tolki/lang/react`.
