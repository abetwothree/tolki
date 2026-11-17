---
"@tolki/enum": patch
"@tolki/ts": patch
---

- Unused enums and routes now drop out of bundles.
- `defineEnum`, `values`, `keys`, `cases`, `tryFrom`, `defineRoute`, `annotatePageProps`, `annotateRequestPayload`, `formSafeOptions`, `getRouteDefaults` and `laravelTsPublish` are marked free of side effects.
- esbuild still needs `/* @__PURE__ */` at the call site, as in `export const Status = /* @__PURE__ */ defineEnum({...})`.
