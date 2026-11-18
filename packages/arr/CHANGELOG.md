# @tolki/arr

## 1.0.2

### Patch Changes

- eaa95c6: - Unused calls to arr's side-effect-free helpers now drop out of bundles, including the getters, filters, sorts, set operations and path readers and writers that return a copy.
  - `pop`, `shift`, `unshift` and `splice` change the array you pass, so a call to them is always kept.
  - arr no longer builds its sort comparator or reads the `SortDirection` enum at import time.
  - `add` and `push` no longer change the caller's nested data when the key is an array or another unusual value.
  - esbuild keeps an unused call unless the call site is written `/* @__PURE__ */ fn(...)`.
- 58202f3: Bundlers, esbuild included, now drop the packages' own module-level setup code when an app doesn't use it.
- 7483429: - `undot` no longer changes the nested arrays or objects of its input, matching Laravel.
  - `dataUndot` and `Collection#undot` inherit this, so they no longer write into their input either.
- Updated dependencies [8cc1759]
- Updated dependencies [58202f3]
- Updated dependencies [3a71e95]
- Updated dependencies [6a9ea1d]
- Updated dependencies [a23227d]
- Updated dependencies [6a9ea1d]
- Updated dependencies [7483429]
  - @tolki/enum@1.2.1
  - @tolki/obj@1.0.2
  - @tolki/path@1.0.2
  - @tolki/str@1.8.1
  - @tolki/utils@1.6.4

## 1.0.1

### Patch Changes

- 5a9be1d: `@tolki/arr/arr` now loads in tools that resolve imports with `require` conditions, such as a Vite config that loads as CommonJS. The export had only an `import` condition, so those tools failed with "This package is ESM only but it was tried to load by `require`".
- Updated dependencies [666c535]
- Updated dependencies [5a9be1d]
- Updated dependencies [5a9be1d]
- Updated dependencies [c2d0ebc]
- Updated dependencies [5a9be1d]
- Updated dependencies [5a9be1d]
  - @tolki/enum@1.1.5
  - @tolki/obj@1.0.1
  - @tolki/path@1.0.1
  - @tolki/str@1.7.1
  - @tolki/utils@1.6.3

## 1.0.0

### Major Changes

- ee73411: Finally releasing this `@tolki/arr` package

### Patch Changes

- Updated dependencies [e332aa3]
- Updated dependencies [ee73411]
- Updated dependencies [ee73411]
- Updated dependencies [e9fb109]
- Updated dependencies [d6942cc]
- Updated dependencies [886f9ad]
  - @tolki/types@1.9.0
  - @tolki/obj@1.0.0
  - @tolki/path@1.0.0
  - @tolki/enum@1.1.3
  - @tolki/utils@1.6.0
