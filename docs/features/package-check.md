# Package check

`pnpm package:check` checks the built `@tolki/*` packages as consumers install them: it type-checks every entry under `node16`, `nodenext`, CommonJS and `bundler` settings, runs `@arethetypeswrong/cli` on each tarball and loads every entry at runtime. It guards #143, where extensionless relative specifiers in the published `.d.ts` files broke `node16` and `nodenext` consumers. Source of truth: [`scripts/package-check/`](../../scripts/package-check/).

## Packing

[`scripts/lib/pack.ts`](../../scripts/lib/pack.ts) packs every package that is not `private` with `pnpm pack`, the same staging [treeshake-check.md](./treeshake-check.md) uses:

- pnpm applies `publishConfig`, `files` and the `workspace:` version rewrite;
- each tarball is extracted into `node_modules/<name>` of a temp consumer under `os.tmpdir()`, with the installed third-party dependencies and peers symlinked beside it;
- a package without `dist` stops the run with "run pnpm build first".

Lifecycle scripts are off (`npm_config_ignore_scripts=true`). `prepack` only repeats the README build and the Vite build that CI has just run, so the declarations and exports in the tarball are the ones that would ship. The packed README may differ, and the check does not judge READMEs. The temp dir is removed at the end, on failure too.

## Cells

Each cell runs the repository's TypeScript 7 `tsc` (`@typescript/native`) on the consumer files, with `strict`, `noEmit`, `skipLibCheck: false`, `types: []` and `target: "esnext"`. Any diagnostic fails the cell. A cell whose files hold no entry, such as `core.mts` under a filter that keeps only excluded entries, is reported as skipped, neither a pass nor a failure. [`consumer.ts`](../../scripts/package-check/consumer.ts) holds `CELLS`.

| Cell              | `module` / `moduleResolution` | Extra options                                                               | Files                                 |
| ----------------- | ----------------------------- | --------------------------------------------------------------------------- | ------------------------------------- |
| `node16-esm`      | `node16` / `node16`           |                                                                             | `esm.mts`, `repro.mts`, `augment.mts` |
| `nodenext-esm`    | `nodenext` / `nodenext`       |                                                                             | `esm.mts`, `repro.mts`, `augment.mts` |
| `nodenext-cjs`    | `nodenext` / `nodenext`       |                                                                             | `cjs.cts`                             |
| `bundler`         | `esnext` / `bundler`          |                                                                             | `esm.mts`, `repro.mts`, `augment.mts` |
| `nodenext-no-dom` | `nodenext` / `nodenext`       | `lib: ["esnext"]`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess` | `core.mts`                            |

## Consumer files

The entries come from each extracted manifest's `exports`, `./package.json` aside:

- an entry with an import target is a value entry: `import * as eN from "<specifier>"; export { eN };`;
- a types-only entry is `import type * as eN …`, unless its declaration file declares no module (`@tolki/lang/client`), which becomes `/// <reference types="<specifier>" />`;
- a missing declaration file stays an import, so every cell reports it.

`esm.mts` and `cjs.cts` hold every entry. `core.mts` leaves out `NO_DOM_EXCLUDED`, the entries that need a framework, Vite or Node types. A listed specifier that no manifest declares fails the run, so the list cannot go stale.

Three fixed inputs cover what a generated import cannot:

- **Wildcard probe.** Each `"./*"` export adds one value entry, the `"."` target without `./dist/` (`@tolki/str/index.js`).
- **`repro.mts`.** The reproduction from #143, with its imports in lint order.
- **`augment.mts`.** Augments `LangRegister` from `@tolki/lang`, and an `@ts-expect-error` proves the augmentation took.

## attw

`attw <tarball> --profile node16 --ignore-rules cjs-resolves-to-esm` runs for every tarball with an entry, from the pinned root devDependency. The `node16` profile checks `node16` from ESM and from CJS, plus `bundler`, and skips `node10`. `cjs-resolves-to-esm` is ignored because the packages ship ESM only and serve `require()` through Node's `require(esm)` (Node 20.19+ and 22.12+); the smoke test proves that at runtime.

## Smoke test

A child Node process in the consumer directory loads every value entry with `import()` and with `createRequire(...)()`. Each failure is reported with its specifier, mode and error code (`ERR_PACKAGE_PATH_NOT_EXPORTED`, `ERR_MODULE_NOT_FOUND`, `ERR_REQUIRE_ASYNC_MODULE`, …).

## No vacuous pass

- The `entries` row fails when a packed package contributes no entry, or when there are no entries at all.
- A unit test in [`package-check.test.ts`](../../scripts/__tests__/package-check.test.ts) runs the cells against [`fixtures/extensionless/`](../../scripts/package-check/fixtures/extensionless/), whose declaration does `export * from "./inner"`. `node16-esm`, `nodenext-esm` and `nodenext-cjs` must report TS2834 or TS2835, and `bundler` must pass.

## Running

```bash
pnpm build
pnpm package:check
pnpm package:check --filter @tolki/str
```

`--filter` keeps the entries whose specifier contains the text, for the cells, attw and the smoke test alike. Every package is still packed, so cross-package imports resolve. A filtered run leaves out `repro.mts` and `augment.mts` and does not check for empty packages. An empty `--filter` is a usage error, and the smoke test is skipped when the filter keeps no value entry.

The output has one row per check (`entries`, each cell, attw per package, the smoke test) with pass, FAIL or skipped, and a count for all but attw. Every failure's details follow. When `GITHUB_STEP_SUMMARY` is set, the rows are also appended there as a markdown table. Exit code 0 means every check passed, 1 a failure and 2 a usage error, including a filter that matches no entry.

CI runs it in the `build-test` job of [`test.yml`](../../.github/workflows/test.yml), after `pnpm run treeshake:check`. The unit tests run in `pnpm test`: `npx vitest run --project scripts package-check`.
