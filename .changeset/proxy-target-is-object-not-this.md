---
"@tolki/types": patch
---

`ProxyTarget` is `object`, not a top-level `this`

`this` is only legal inside a class or interface member, so the published `export type ProxyTarget = this;` alias never type-checked — `skipLibCheck: true` (the default for consumers, and previously for this repo's own `pnpm ts:check`) hid the `TS2526` error. A `Proxy` target must be an object (`ProxyHandler<T extends object>`), which is what the alias always meant, so it is now `export type ProxyTarget = object;`.
