# @tolki/enum

## 1.1.1

### Patch Changes

- df53c94: Surface the artisan command's stdout/stderr in Vite plugin failure messages

  Previously, when the `ts:publish` command failed, the plugin only reported
  Node's generic `Command failed: <command>` message, so the actual PHP error
  was invisible unless the command was re-run manually in a terminal. The
  plugin now appends the captured stderr and stdout from the failed command
  to both the logged error (dev mode) and the thrown error (build mode).

## 1.1.0

### Minor Changes

- d9d43ea: Create new PHP enums files with SortDirection enum to use in collection, arr, and obj packages.

## 1.0.1

### Patch Changes

- cd2d57e: Minor fixes and improvements
- Updated dependencies [cd2d57e]
  - @tolki/types@1.1.5

## 1.0.0

### Major Changes

- v1 release 🎉 to align with laravel-ts-publish's v1 release

## 0.0.6

### Patch Changes

- 53a5a05: Default the folder to be "data" and fix enum types to properly catch when any helper properties are missing
- Updated dependencies [53a5a05]
  - @tolki/types@1.1.4

## 0.0.5

### Patch Changes

- a1f6b9e: - Rename `ToEnumResult` to `FromResult` in `@tolki/types`.
  - `from()` now returns results that include a `name` field alongside the value.
  - Introduce `AsEnum` in `@tolki/types` / `@tolki/enum` for working with enum shapes.
  - In production builds, append `--only-enums` to `vite build` so that only enums are published, speeding up the build.

## 0.0.4

### Patch Changes

- 2526f7c: Ability to call the `php artisan ts:publish` command for a specific file for Vite plugin file watcher
- Updated dependencies [db71d46]
  - @tolki/types@1.1.2

## 0.0.3

### Patch Changes

- Fix command loop when manifest file changes after command runs, document sail command

## 0.0.2

### Patch Changes

- 25dfe53: Fix vite export path
- 24ca41d: Heading styling on copied documentation to each package readme.md
- Updated dependencies [24ca41d]
  - @tolki/types@1.1.1

## 0.0.1

### Patch Changes

- Remove vite-plugin from barrel export, make explicit under sub path of `/vite`
