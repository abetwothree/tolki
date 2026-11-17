---
"@tolki/utils": patch
---

- Bundlers can now drop unused calls to type guards, key, cast, range, sorting, string and comparison helpers.
- `defineKey`, `writeMapKey` and `deleteMapKey` are marked as mutating, so bundlers keep their calls.
- esbuild keeps an unused call unless the call site is written `/* @__PURE__ */ fn(...)`.
