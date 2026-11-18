---
"@tolki/enum": patch
"@tolki/ts": patch
---

- Unused enums and routes now drop out of bundles.
- `defineEnum`, `values`, `keys`, `cases`, `tryFrom`, `defineRoute`, `annotatePageProps`, `annotateRequestPayload`, `formSafeOptions`, `getRouteDefaults` and `laravelTsPublish` are marked free of side effects.
- esbuild keeps an unused call unless the call site is written `/* @__PURE__ */ fn(...)`, as in `export const Status = /* @__PURE__ */ defineEnum({...})`.
- Curried generated routes, `annotatePageProps<T>()(…)` and `annotateRequestPayload<T>()(…)`, stay in Rolldown, esbuild and webpack unless each call is written with `/* @__PURE__ */`. Rollup and Rspack drop them.
