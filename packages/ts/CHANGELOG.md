# @tolki/ts

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
