# @tolki/ts

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
