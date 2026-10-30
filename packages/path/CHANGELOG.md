# @tolki/path

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
