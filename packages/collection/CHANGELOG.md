# @tolki/collection

## 1.0.3

### Patch Changes

- f0adf9f: - An unused `collect(...)` call now drops out of bundles, because it only builds a new collection. `Collection` is a class, so a top-level `new Collection(...)` still needs a call-site `/* @__PURE__ */`.
  - collection no longer builds its sort comparator or reads the `SortDirection` enum at import time.
  - In Vite 8 (Rolldown) and Rspack, an unused call to `collect` drops, but `Collection`'s own class cycle can stay behind unless the call is written `/* @__PURE__ */ collect(...)`.
  - esbuild keeps an unused call unless the call site is written `/* @__PURE__ */ fn(...)`.
- 58202f3: Bundlers, esbuild included, now drop the packages' own module-level setup code when an app doesn't use it.
- 7483429: - `undot` no longer changes the nested arrays or objects of its input, matching Laravel.
  - `dataUndot` and `Collection#undot` inherit this, so they no longer write into their input either.
- Updated dependencies [278e39a]
- Updated dependencies [8cc1759]
- Updated dependencies [58202f3]
- Updated dependencies [6a9ea1d]
- Updated dependencies [6a9ea1d]
- Updated dependencies [7483429]
  - @tolki/data@1.0.3
  - @tolki/enum@1.2.1
  - @tolki/path@1.0.2
  - @tolki/utils@1.6.4

## 1.0.2

### Patch Changes

- a20f1a7: `mode()` now returns float values as they are, as Laravel 13.38 does. Before, `collect([1.5, 1.5, 2.5]).mode()` returned `[1]` instead of `[1.5]`.
- Updated dependencies [ba95281]
- Updated dependencies [972d5e6]
  - @tolki/enum@1.2.0
  - @tolki/types@1.12.0

## 1.0.1

### Patch Changes

- 5a9be1d: `@tolki/collection/collection` now loads in tools that resolve imports with `require` conditions, such as a Vite config that loads as CommonJS. The export had only an `import` condition, so those tools failed with "This package is ESM only but it was tried to load by `require`".
- Updated dependencies [5a9be1d]
- Updated dependencies [666c535]
- Updated dependencies [5a9be1d]
- Updated dependencies [5a9be1d]
  - @tolki/data@1.0.2
  - @tolki/enum@1.1.5
  - @tolki/path@1.0.1
  - @tolki/utils@1.6.3

## 1.0.0

### Major Changes

- ee73411: Finally releasing this `@tolki/collection` package

### Patch Changes

- Updated dependencies [e332aa3]
- Updated dependencies [ee73411]
- Updated dependencies [ee73411]
- Updated dependencies [e9fb109]
- Updated dependencies [d6942cc]
- Updated dependencies [886f9ad]
  - @tolki/types@1.9.0
  - @tolki/data@1.0.0
  - @tolki/path@1.0.0
  - @tolki/enum@1.1.3
  - @tolki/utils@1.6.0
