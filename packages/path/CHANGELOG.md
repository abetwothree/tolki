# @tolki/path

## 1.0.2

### Patch Changes

- 58202f3: Bundlers, esbuild included, now drop the packages' own module-level setup code when an app doesn't use it.
- 6a9ea1d: - Bundlers can now drop unused calls to path readers, immutable set and forget, flatten and undot helpers.
  - `pushWithPath`, `setMixed` and `pushMixed` are marked as mutating, so bundlers keep their calls.
  - esbuild keeps an unused call unless the call site is written `/* @__PURE__ */ fn(...)`.
- 7483429: - `undot` no longer changes the nested arrays or objects of its input, matching Laravel.
  - `dataUndot` and `Collection#undot` inherit this, so they no longer write into their input either.
- Updated dependencies [6a9ea1d]
  - @tolki/utils@1.6.4

## 1.0.1

### Patch Changes

- 5a9be1d: `@tolki/path/path` and `@tolki/path/pluck` now load in tools that resolve imports with `require` conditions, such as a Vite config that loads as CommonJS. The exports had only an `import` condition, so those tools failed with "This package is ESM only but it was tried to load by `require`".
- Updated dependencies [5a9be1d]
  - @tolki/utils@1.6.3

## 1.0.0

### Major Changes

- ee73411: Finally releasing this `@tolki/path` package

### Patch Changes

- Updated dependencies [e332aa3]
- Updated dependencies [d6942cc]
- Updated dependencies [886f9ad]
  - @tolki/types@1.9.0
  - @tolki/utils@1.6.0
