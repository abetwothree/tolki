# Troubleshooting Types

If a value imported from a `@tolki/*` package types as `any` in your app — with no red squiggle, no build error, nothing — this page walks through why, and how it's guarded against going forward.

## Symptom

An import from a built `@tolki/*` package (`@tolki/ts`, `@tolki/enum`, `@tolki/utils`, `@tolki/arr`, `@tolki/collection`, or `@tolki/data`) resolves to `any` instead of its real type, and neither `tsc` nor your editor reports anything wrong.

This stays invisible because `skipLibCheck: true` — the default in most starter `tsconfig.json` files — skips type-checking inside `.d.ts` files entirely, including the one line that fails to resolve. The import silently degrades to `any` instead of raising `TS2307: Cannot find module`.

Paste this into your project against any `@tolki/*` export you already use, replacing `defineEnum` and the package with your own import:

```typescript
import { defineEnum } from "@tolki/ts";
type ShouldBeAFunction = "not-a-function";
const probe: ShouldBeAFunction = defineEnum;
```

If this compiles without error, the import is `any` and you're hitting this defect. If `tsc` reports that a function isn't assignable to `"not-a-function"`, the type is resolving correctly.

## Cause

The root `tsconfig.json` aliases `@tolki/*` for use inside this monorepo:

```json
{
  "compilerOptions": {
    "paths": {
      "@tolki/*": ["./packages/*/src/index.ts"]
    }
  }
}
```

`vite-plugin-dts` resolved that alias during declaration emit — rewriting a bare cross-package specifier like `@tolki/types` into a relative path, computed against the tsconfig root rather than the emitted file's own location in `dist/`. The result resolves nowhere once a package is installed from npm:

```typescript
// Broken: packages/ts/dist/enums.d.ts, one directory up from where it's actually emitted
import { AsEnum, DefineEnumResult } from "../packages/types/src/index.ts";
```

```typescript
// Correct: the bare specifier, resolved through node_modules like any other dependency
import { AsEnum, DefineEnumResult } from "@tolki/types";
```

The runtime `.js` output was never affected — Rollup's `external` handling already kept the bare `@tolki/*` specifier there. This was purely a declaration-emit (`.d.ts`) defect.

## Fix

The shared `dts()` plugin config (`vite.config.ts`, merged into every package's build via `mergeConfig`) excludes `@tolki/*` from alias resolution:

```typescript
dts({
  // ...
  aliasesExclude: [/^@tolki\//],
});
```

With the alias excluded, the plugin emits the bare specifier as written in source instead of resolving it, and consumers resolve it through `node_modules` the normal way. This applies to `vite-plugin-dts@^4.5.4`, the version this monorepo currently builds with.

## The specifier guard

`scripts/__tests__/dts-specifiers.test.ts` scans every `packages/*/dist/**/*.d.ts` file for a relative specifier that reaches into another package's directory, and fails if it finds one.

It runs under a bare `pnpm test` because `scripts/` is registered as its own inline Vitest project in `vite.config.ts`'s `test.projects` array — `scripts/` sits outside the `packages/*` glob the other projects use, so without that entry the test would never be collected.

The guard only means something against a **freshly built** tree. It inspects whatever `.d.ts` files already exist on disk; it does not build anything itself, and a first assertion (`files.length` must be greater than zero) only rules out running against an empty `dist/`, not a stale one. Run `pnpm --filter <package> build` (or rebuild every package) before trusting a pass or a fail from this test.

## The stale `dist/` trap

`dist/` is gitignored, so nothing keeps it in sync with your source or your build config. A partial or out-of-date build leaves stale output sitting on disk indistinguishable from a fresh one — and reading it produces confident, wrong conclusions about which packages are affected.

That happened during the investigation behind this fix: three packages (`@tolki/arr`, `@tolki/collection`, `@tolki/data`) appeared to already emit working, if differently-shaped, relative specifiers. That was leftover output from an earlier build that had never been touched. A genuinely clean rebuild — `rm -rf packages/*/dist` followed by building all six packages fresh — showed every one of them emitting the same broken specifier.

Before drawing any conclusion from what's in a package's `dist/`, clear it first:

Bash:
  rm -rf packages/*/dist
  pnpm --filter @tolki/ts --filter @tolki/enum --filter @tolki/utils --filter @tolki/arr --filter @tolki/collection --filter @tolki/data run build
PowerShell:
  Remove-Item -Recurse -Force packages/*/dist
  pnpm --filter @tolki/ts --filter @tolki/enum --filter @tolki/utils --filter @tolki/arr --filter @tolki/collection --filter @tolki/data run build
