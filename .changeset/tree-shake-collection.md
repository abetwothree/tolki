---
"@tolki/collection": patch
---

- An unused `collect(...)` call now drops out of bundles, because it only builds a new collection. `Collection` is a class, so a top-level `new Collection(...)` still needs a call-site `/* @__PURE__ */`.
- collection no longer builds its sort comparator or reads the `SortDirection` enum at import time.
- In Vite 8 (Rolldown) and Rspack, an unused call to `collect` drops, but `Collection`'s own class cycle can stay behind unless the call is written `/* @__PURE__ */ collect(...)`.
