---
"@tolki/ts": patch
"@tolki/enum": patch
"@tolki/utils": patch
---

Fix built declaration files emitting a dist-relative specifier for cross-package type imports (e.g. `../../../types/src/index` instead of `@tolki/types`), which resolved nowhere once installed from npm.

The dts plugin now excludes `@tolki/*` aliases from resolution, so these imports emit as bare package specifiers that consumers resolve through `node_modules`, matching the corresponding runtime `dependencies` entry.

No API changed — this only corrects the emitted type specifier.
