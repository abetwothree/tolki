---
"@tolki/enum": patch
---

- Rename `ToEnumResult` to `FromResult` in `@tolki/types`.
- `from()` now returns results that include a `name` field alongside the value.
- Introduce `AsEnum` in `@tolki/types` / `@tolki/enum` for working with enum shapes.
- In production builds, append `--only-enums` to `vite build` so that only enums are published, speeding up the build.