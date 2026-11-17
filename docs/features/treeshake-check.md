# Tree-shake check

`pnpm treeshake:check` bundles the built `@tolki/*` packages with five bundlers and fails on a tree-shaking regression. It is the bundle-level half of the guard; [side-effect-annotations.md](./side-effect-annotations.md) is the source-level half. Source of truth: [`scripts/treeshake/`](../../scripts/treeshake/).

## Staging

[`stage.ts`](../../scripts/treeshake/stage.ts) copies each published package into a temp dir under `os.tmpdir()`, the way pnpm publishes it:

- `publishConfig` applied over the top-level fields;
- only the manifest's `files`;
- installed dependencies and peers symlinked.

Bundles read the built `dist`, never linked source, so an annotation the build loses fails the check. Without a `dist`, the check stops with "run pnpm build first". The temp dir is removed at the end, on failure too.

## Bundlers

[`bundlers.ts`](../../scripts/treeshake/bundlers.ts), with `vue`, `react`, `svelte`, `svelte/*`, `vite` and `node:*` external in each:

| Bundler  | Settings                                                                             | Own-module sizes             |
| -------- | ------------------------------------------------------------------------------------ | ---------------------------- |
| Rollup   | `@rollup/plugin-node-resolve` (`browser`), `@rollup/plugin-commonjs`, ES output      | `renderedLength`             |
| Rolldown | `platform: "browser"`, `minify: true`                                                | `renderedLength`, pre-minify |
| esbuild  | `bundle`, ESM, `platform: "browser"`, whitespace and syntax minify, identifiers kept | `bytesInOutput`              |
| webpack  | `mode: "production"`, `target: "web"`, `devtool: false`, externals as `commonjs`     | none                         |
| Rspack   | same as webpack                                                                      | none                         |

esbuild keeps identifiers because its renamer weighs the text of code it later drops, so a dropped call could still rename the output.

## Fixtures

[`fixtures.ts`](../../scripts/treeshake/fixtures.ts) builds them from each subpath's runtime exports (`Object.keys` of the staged entry) and from the [source scan](../../scripts/side-effects/scan.ts). Ids are `<check>:<specifier>[:<name>]`.

- **One declaration, one test.** Each runtime export is mapped to the source file that declares it: the scanned file whose `dist` module exports the identical value. A declaration exported by several subpaths is tested once, from `"."` when it is there. Two same-named declarations, such as `@tolki/lang`'s `createLang` in `lang.ts` and `vue.ts`, are each tested through the subpath that ships them.
- **Different marks fail.** A runtime-exported name its package declares in several files with different marks is a finding of the scan (`drop:<pkg>:<name> [scan]`), naming each file.
- **Node-only subpaths.** An entry whose `dist` imports a `node:` built-in, directly or through its own modules, runs in a Vite config and is never browser-bundled. `parity` skips it; the other checks still run.

| Check                      | One per                                                     | Bundlers                                     | Passes when                                                                                |
| -------------------------- | ----------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `bare`                     | subpath                                                     | Rollup, Rolldown, strict                     | Rollup: 0 bytes of every own module. Rolldown: the minified bundle equals an empty entry's |
| `parity`                   | exported name, except on Node-only subpaths                 | Rolldown, esbuild                            | esbuild keeps no own module that Rolldown drops                                            |
| `surface`                  | subpath                                                     | all five                                     | importing every name builds with no missing export                                         |
| `namespace`                | subpath                                                     | Rollup, Rolldown, esbuild                    | `ns.<first name>` keeps the same own modules as the named import                           |
| `drop`                     | subpath with pure names                                     | all five: esbuild `kept`, the rest `dropped` | unused calls of every pure name match the control                                          |
| `drop` (`:call-site-pure`) | the same                                                    | esbuild `dropped`                            | the same calls with `/* @__PURE__ */` match the control                                    |
| `keep`                     | `@sideEffects mutates` export                               | all five `kept`                              | `f(target)` on a used target differs from the control                                      |
| `keep` (`canary`)          | one, always                                                 | all five `kept`                              | an `@tolki/enum` `from(...)` call differs from the control                                 |
| `shape`                    | generated consumer file, with and without `:call-site-pure` | all five                                     | each bundler gives its expected outcome (below)                                            |

The four shapes are the enum file (`defineEnum`, `values`), a plain `defineRoute`, and the curried `annotatePageProps()(defineRoute(...))` and `annotateRequestPayload()(defineRoute(...))`. Each entry imports only an unrelated `used` export.

The canary keeps `kept` observable in every bundler whatever the packages annotate: `from` throws on bad input and is never annotated. The fixture work dir's `package.json` has no `sideEffects` key on purpose: with `false`, webpack and Rspack would drop every app-module call, and every `drop` and `shape` fixture would pass without testing anything.

## Expected outcomes

Measured in Appendix B, table 4 of the [plan](../superpowers/plans/2026-11-17-tree-shaking-side-effects.md), for packages whose pure functions carry the annotation. `SHAPES` and `dropFixture` in `fixtures.ts` hold them.

| Fixture                                               | Rollup  | Rolldown | esbuild | webpack | Rspack  |
| ----------------------------------------------------- | ------- | -------- | ------- | ------- | ------- |
| `drop`, enum file, plain `defineRoute`                | dropped | dropped  | kept    | dropped | dropped |
| curried `annotatePageProps`, `annotateRequestPayload` | dropped | kept     | kept    | kept    | kept    |
| any `:call-site-pure` fixture                         | dropped | dropped  | dropped | dropped | dropped |
| `keep`                                                | kept    | kept     | kept    | kept    | kept    |

The `drop` call-site-pure fixture runs in esbuild only.

## Control builds

`drop`, `keep` and `shape` also bundle a control: the same app module with the calls removed and the import line kept. `dropped` means the bundle is byte-identical to the control, and `kept` means it differs. esbuild stops inlining constants in a module that has an import, so a control without the import never matches. Rolldown's `bare` uses the same rule against an empty entry.

Per-module sizes cannot replace the control. webpack and Rspack concatenate modules and report none, and Rolldown measures before its minifier runs. A size also cannot tell a kept call from the function body a used export needs. `runFixture` throws when a fixture that compares lacks its control or an expectation for one of its bundlers, so a check cannot pass by skipping.

## Strict mode

`bare` forces every `@tolki` module side-effectful and every other module side-effect free. Any module-scope code the bundler cannot prove pure then shows up. Only Rollup and Rolldown support it. Rollup's unminified own-module sizes give the strict view. Rolldown is judged on its final minified bundle, because its `renderedLength` counts code its minifier then removes (the lang `Translator` static block, for one).

## Failures

- A failed combined `drop` re-runs one fixture per name in the failing bundler, so the finding names each kept function (`drop:<spec>:<name>`).
- A build error is a finding, never a crash of the whole run.
- **D5 tripwire:** a fixture expected `kept` that comes out `dropped` (esbuild's `drop`, the curried shapes) fails with "expectation changed: update docs/features/treeshake-check.md and docs/vitepress/tree-shaking.md". A bundler upgrade that starts dropping such a call must update the expected outcome, here and in the user docs.

## Debt

[`debt.json`](../../scripts/treeshake/debt.json) lists known findings as `{ id, bundler, issue, reason }`. Each entry excuses one finding with the same id and bundler. An entry that excuses nothing is stale, and stale fails, so fixed debt has to be deleted. Every entry names an issue. Debt never excuses a `build failed:` or `missing exports:` finding, or a scan finding.

## Running

```bash
pnpm build
pnpm treeshake:check
pnpm treeshake:check --check shape
pnpm treeshake:check --check drop --filter @tolki/str
```

`--check` takes a comma list of checks, and `--filter` keeps the fixtures whose id contains the text. A filtered run reports stale debt only for the fixtures it ran. The output has one row per check (fixtures, failures, excused debt), then the failures, debt hits and stale entries. Exit code 1 means a failure or stale debt, and 2 a usage error. When `GITHUB_STEP_SUMMARY` is set, the table is also appended there as markdown.

CI runs it in the `build-test` job of [`test.yml`](../../.github/workflows/test.yml), after `pnpm run build`. The unit tests of the fixture builder, the debt split and `runFixture` run in `pnpm test`: `npx vitest run --project scripts treeshake`.

## Wall time

A full run (743 fixtures) took 24.6 s on an Apple M2 Max with 12 workers (`os.availableParallelism()`), against 13.9 s for `pnpm build`.
