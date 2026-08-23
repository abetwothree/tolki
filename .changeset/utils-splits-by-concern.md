---
"@tolki/utils": patch
---

Split the package source by concern instead of one flat module.

`utils.ts` had grown to 1032 lines and 47 exports in a single file, with no grouping and new helpers appended to the bottom. It is now a barrel over six focused modules: `guards.ts` (type guards), `cast.ts` (conversion), `equality.ts` (comparison), `keys.ts` (object keys), `string.ts` (shared string helpers), and `reflect.ts` (runtime type reflection). Tests mirror the same layout.

This is an internal reorganization: every export keeps its name, signature, and behavior, and both the `@tolki/utils` and `@tolki/utils/utils` entry points resolve exactly as before, so no consuming code changes.
