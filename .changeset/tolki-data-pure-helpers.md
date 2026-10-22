---
"@tolki/data": patch
---

Bundlers can now leave out the `@tolki/data` helpers an app never imports. Before, esbuild kept every helper, and most of `@tolki/arr` and `@tolki/obj` with them, as soon as one was imported: `dataGet` alone bundled to about 52 KB minified, and now to about 7 KB.
