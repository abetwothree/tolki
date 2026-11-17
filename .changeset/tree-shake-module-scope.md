---
"@tolki/arr": patch
"@tolki/obj": patch
"@tolki/collection": patch
"@tolki/enum": patch
"@tolki/lang": patch
"@tolki/path": patch
"@tolki/str": patch
"@tolki/ts": patch
---

Bundlers, esbuild included, now drop the packages' own module-level setup code when an app doesn't use it.
