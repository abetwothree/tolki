# @tolki/enum

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
