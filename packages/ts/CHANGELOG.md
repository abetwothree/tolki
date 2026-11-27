# @tolki/ts

## 1.1.2

### Patch Changes

- f6a408b: Fixes type errors in projects that use `moduleResolution` `node16` or `nodenext`: the published declaration files now name every file they import, so every export resolves (#143). Each export in `package.json` also lists its types first.
- Updated dependencies [56892d5]
- Updated dependencies [56892d5]
- Updated dependencies [f6a408b]
- Updated dependencies [f6a408b]
- Updated dependencies [f6a408b]
- Updated dependencies [15d1693]
  - @tolki/types@1.13.0
  - @tolki/utils@1.7.0
  - @tolki/enum@1.2.2

## 1.1.1

### Patch Changes

- 8cc1759: - Unused enums and routes now drop out of bundles.
  - `defineEnum`, `values`, `keys`, `cases`, `tryFrom`, `defineRoute`, `annotatePageProps`, `annotateRequestPayload`, `formSafeOptions`, `getRouteDefaults` and `laravelTsPublish` are marked free of side effects.
  - esbuild keeps an unused call unless the call site is written `/* @__PURE__ */ fn(...)`, as in `export const Status = /* @__PURE__ */ defineEnum({...})`.
  - Curried generated routes, `annotatePageProps<T>()(…)` and `annotateRequestPayload<T>()(…)`, stay in Rolldown, esbuild and webpack unless each call is written with `/* @__PURE__ */`. Rollup and Rspack drop them.
- 58202f3: Bundlers, esbuild included, now drop the packages' own module-level setup code when an app doesn't use it.
- Updated dependencies [8cc1759]
- Updated dependencies [58202f3]
- Updated dependencies [6a9ea1d]
  - @tolki/enum@1.2.1
  - @tolki/utils@1.6.4

## 1.1.0

### Minor Changes

- c3d5ccf: Re-export `values()` and `keys()` from `@tolki/enum`, which return a published enum's case values and case names in PHP's case order.

### Patch Changes

- Updated dependencies [ba95281]
- Updated dependencies [972d5e6]
  - @tolki/enum@1.2.0
  - @tolki/types@1.12.0

## 1.0.4

### Patch Changes

- 8a6b429: Make vite an optional peer dependency for the `@tolki/enum` and `@tolki/ts` packages.
- c647f7c: Fixes how `@tolki/ts/vite` builds the command it runs for a changed file.
  - A source file's path containing `$&`, `$'`, `` $` `` or `$$` is no longer expanded inside the `{file}` substitution.
  - A source file whose path contains the text `--quiet` no longer stops the plugin from adding `--quiet`.
  - On Windows, the `{file}` path is now double-quoted, because cmd.exe reads single quotes as part of the value.
  - `escapeShellArg` now comes from `@tolki/utils`.

- Updated dependencies [8a6b429]
- Updated dependencies [c647f7c]
- Updated dependencies [c647f7c]
  - @tolki/enum@1.1.4
  - @tolki/types@1.11.0
  - @tolki/utils@1.6.2

## 1.0.3

### Patch Changes

- e9fb109: `@tolki/ts` now re-exports `defineEnum`, `from`, `tryFrom` and `cases`, and the `AsEnum`, `CaseValue`, `DefineEnumResult`, `EnumConst` and `FromResult` types, from `@tolki/enum` instead of shipping its own copy, so both packages run the same code. Imports from `@tolki/ts` and `@tolki/ts/enums` don't change, and installing `@tolki/ts` now also installs `@tolki/enum`.
- Updated dependencies [e332aa3]
- Updated dependencies [e9fb109]
- Updated dependencies [d6942cc]
- Updated dependencies [886f9ad]
  - @tolki/types@1.9.0
  - @tolki/enum@1.1.3
  - @tolki/utils@1.6.0

## 1.0.2

### Patch Changes

- 77323d4: Fix built declaration files emitting a dist-relative specifier for cross-package type imports (e.g. `../../../types/src/index` instead of `@tolki/types`), which resolved nowhere once installed from npm.

  The dts plugin now excludes `@tolki/*` aliases from resolution, so these imports emit as bare package specifiers that consumers resolve through `node_modules`, matching the corresponding runtime `dependencies` entry.

  No API changed — this only corrects the emitted type specifier.

- Updated dependencies [77323d4]
- Updated dependencies [5174f99]
- Updated dependencies [35fb407]
  - @tolki/utils@1.2.0

## 1.0.1

### Patch Changes

- df53c94: Surface the artisan command's stdout/stderr in Vite plugin failure messages

  Previously, when the `ts:publish` command failed, the plugin only reported
  Node's generic `Command failed: <command>` message, so the actual PHP error
  was invisible unless the command was re-run manually in a terminal. The
  plugin now appends the captured stderr and stdout from the failed command
  to both the logged error (dev mode) and the thrown error (build mode).

## 1.0.0

### Major Changes

- 18e79b7: First release of `@tolki/ts` alongside Laravel TS Publish V2

### Patch Changes

- a10bab5: Fix `defineRoute()`'s bare `.form(...)` call so it spoofs the route's primary method (adding `_method=PUT`/`PATCH`/`DELETE` etc.) exactly like Laravel Wayfinder's `.form()` does, and like the existing per-verb `.form.<verb>(...)` variants already did.

  Previously, calling `.form(...)` with no verb on a route whose primary method wasn't `GET` or `POST` (e.g. an `update` or `destroy` action) built an `action` URL with no `_method` field, so the form would silently submit as the wrong HTTP verb unless the caller explicitly used `.form.put(...)`, `.form.patch(...)`, or `.form.delete(...)`.

## 0.2.0

### Minor Changes

- Add annotations for route form request data

### Patch Changes

- Updated dependencies
  - @tolki/types@1.4.0

## 0.1.0

### Minor Changes

- Add `annotatePageProps` helper to forward controller return types to Inertia.js routes

  Introduces `annotatePageProps(data)` helper for better type inference in `defineRoute`:
  - Allows controller method return types to flow through to route definitions for full type safety
  - Enables IDE IntelliSense for page props without manual type annotations
  - Works with Laravel controller methods that return Inertia responses
  - Simplifies type-safe Inertia.js integration in TypeScript projects

### Patch Changes

- Updated dependencies
  - @tolki/types@1.3.0
