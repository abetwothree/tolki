---
"@tolki/types": minor
---

Fixes type errors in projects that use `moduleResolution` `node16` or `nodenext`: the published declaration files now name every file they import, so every export resolves (#143). Each export in `package.json` also lists its types first.

- `@tolki/types/responses` works again; it had pointed at a file that no longer exists.
- New subpaths: `@tolki/types/resource-responses`, `@tolki/types/json-api` and `@tolki/types/routes`.
