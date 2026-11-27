# @tolki/obj

## 1.0.3

### Patch Changes

- f6a408b: Fixes type errors in projects that use `moduleResolution` `node16` or `nodenext`: the published declaration files now name every file they import, so every export resolves (#143). Each export in `package.json` also lists its types first.
- Updated dependencies [56892d5]
- Updated dependencies [56892d5]
- Updated dependencies [f6a408b]
- Updated dependencies [f6a408b]
- Updated dependencies [f6a408b]
- Updated dependencies [f6a408b]
- Updated dependencies [f6a408b]
- Updated dependencies [18cd805]
- Updated dependencies [15d1693]
  - @tolki/types@1.13.0
  - @tolki/utils@1.7.0
  - @tolki/enum@1.2.2
  - @tolki/path@1.0.3
  - @tolki/str@1.9.0

## 1.0.2

### Patch Changes

- 58202f3: Bundlers, esbuild included, now drop the packages' own module-level setup code when an app doesn't use it.
- 3a71e95: - Unused calls to obj's side-effect-free helpers now drop out of bundles, including the getters, filters, sorts, set operations and path readers and writers that return a copy.
  - `pop`, `shift`, `unshift` and `splice` change the object or Map you pass, so a call to them is always kept.
  - obj no longer builds its sort comparator or reads the `SortDirection` enum at import time.
  - esbuild keeps an unused call unless the call site is written `/* @__PURE__ */ fn(...)`.
- 7483429: - `undot` no longer changes the nested arrays or objects of its input, matching Laravel.
  - `dataUndot` and `Collection#undot` inherit this, so they no longer write into their input either.
- Updated dependencies [8cc1759]
- Updated dependencies [58202f3]
- Updated dependencies [6a9ea1d]
- Updated dependencies [a23227d]
- Updated dependencies [6a9ea1d]
- Updated dependencies [7483429]
  - @tolki/enum@1.2.1
  - @tolki/path@1.0.2
  - @tolki/str@1.8.1
  - @tolki/utils@1.6.4

## 1.0.1

### Patch Changes

- 5a9be1d: `@tolki/obj/obj` now loads in tools that resolve imports with `require` conditions, such as a Vite config that loads as CommonJS. The export had only an `import` condition, so those tools failed with "This package is ESM only but it was tried to load by `require`".
- Updated dependencies [666c535]
- Updated dependencies [5a9be1d]
- Updated dependencies [c2d0ebc]
- Updated dependencies [5a9be1d]
- Updated dependencies [5a9be1d]
  - @tolki/enum@1.1.5
  - @tolki/path@1.0.1
  - @tolki/str@1.7.1
  - @tolki/utils@1.6.3

## 1.0.0

### Major Changes

- ee73411: Finally releasing this `@tolki/obj` package

### Patch Changes

- Updated dependencies [e332aa3]
- Updated dependencies [ee73411]
- Updated dependencies [e9fb109]
- Updated dependencies [d6942cc]
- Updated dependencies [886f9ad]
  - @tolki/types@1.9.0
  - @tolki/path@1.0.0
  - @tolki/enum@1.1.3
  - @tolki/utils@1.6.0
