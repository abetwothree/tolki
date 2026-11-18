# Bundling and Tree-Shaking

What the `@tolki` packages promise your bundler, and the few cases where you add a `/* @__PURE__ */` comment yourself.

The results below were measured on Rollup 4.68.5, Rolldown 1.3.2 (Vite 8), esbuild 0.28.2, webpack 5.112.2 and Rspack 2.3.3, against the published form of each package. The repository's `pnpm treeshake:check` repeats the measurements and fails when a bundler changes an outcome, so this page is updated with it.

## What the packages guarantee

- **Unused imports leave your bundle.** Every package sets `"sideEffects": false`, and named imports shake in all five bundlers. <!-- scripts/treeshake/fixtures.ts, "bare:@tolki/str" -->
- **Unused calls leave too.** A function with no side effects carries `/* @__NO_SIDE_EFFECTS__ */`. Rollup, Rolldown, webpack and Rspack then drop a call whose result nothing uses, including a call at the top level of a module. <!-- scripts/treeshake/fixtures.ts, "drop:@tolki/str" -->
- **Importing a package runs no setup code.** The packages' own module-level calls are marked `/* @__PURE__ */`, so a bundler drops them when nothing uses them, esbuild included. <!-- scripts/treeshake/fixtures.ts, "parity:@tolki/arr:get" -->
- **Functions with effects are always kept.** A function that changes what you pass, writes module state, runs a callback for its effects or exists to throw has no annotation, so a call to it stays. Each package page names its own, such as `pop` and `shift` in [Arrays & Objects](/arrays-objects/#bundling) and `useLocale` in [Numbers](/numbers/#bundling). <!-- scripts/treeshake/fixtures.ts, "keep:@tolki/arr:pop" -->

## Namespace imports

A namespace import shakes exactly like named imports when you read its members by name:

```typescript
import * as Str from "@tolki/str";

export const title = Str.after(input, ":");
```

Only `Str.after` and what it needs end up in the bundle. <!-- scripts/treeshake/fixtures.ts, "namespace:@tolki/str" --> The same holds for `@tolki/arr`, `@tolki/num` and the other packages.

Two uses keep the whole package, because the bundler can no longer tell which members you need:

- passing the namespace object around, as in `register(Str)`;
- reading a computed member, as in `Str[name]`.

## Per bundler

| Bundler           | An unused call to a helper                                                                                                              | What you do                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Rollup            | Dropped, and nothing is left behind.                                                                                                    | Nothing.                                                                |
| Rolldown (Vite 8) | Dropped. For the helpers in [Dependency residue](#dependency-residue), the code behind them can stay.                                   | Nothing for helpers. `/* @__PURE__ */` on the dependency-residue calls. |
| esbuild           | Kept. esbuild never follows `/* @__NO_SIDE_EFFECTS__ */` from one file to another.                                                      | Write `/* @__PURE__ */ fn(...)` on every call you want removed.         |
| webpack           | Dropped, and nothing is left behind.                                                                                                    | Nothing.                                                                |
| Rspack            | Dropped. A few helpers leave code behind (see [Dependency residue](#dependency-residue)), and so does an enum file that derives a list. | Nothing, or `/* @__PURE__ */` on those calls.                           |

<!-- scripts/treeshake/expectations.ts, "KEPT_DROPS" -->

"Dropped" means the bundle came out byte-identical to one without the call. <!-- scripts/treeshake/fixtures.ts, "drop:@tolki/num" -->

## When to write `/* @__PURE__ */`

Put the comment right before the call, on the call itself and on each call nested in its arguments:

```typescript
export const id = /* @__PURE__ */ uuid();
```

You need it in these cases:

- **esbuild.** It drops the call only with the comment. With it, an unused call drops in all five bundlers. <!-- scripts/treeshake/fixtures.ts, "drop:@tolki/str:call-site-pure" -->
- **Enum and route files from an older publisher or a custom template.** See [Generated enums and routes](#generated-enums-and-routes).
- **A class.** `new Collection(...)`, `new Translator(...)` and `new Stringable(...)` can stay in the bundle without it, because a bundler cannot mark a constructor. A call-site `/* @__PURE__ */ new Collection(...)` drops them in every bundler.
- **A helper that leaves dependency code behind** in Rolldown or Rspack. See below.

## Dependency residue

In Rolldown and Rspack, an unused top-level call to one of these helpers drops the call but can keep the code of the package behind it. Writing `/* @__PURE__ */` before the call drops everything. <!-- scripts/treeshake/expectations.ts, "KEPT_DROPS" --> <!-- scripts/treeshake/fixtures.ts, "drop:@tolki/str:call-site-pure" -->

The cause is how the packages are published: Rolldown honours `/* @__NO_SIDE_EFFECTS__ */` across files only on a function exported inline (`export function f`), and the published files use export lists. So the call goes, and the dependency of the helper's module stays.

| Helpers                                                                                                               | What can stay behind                              |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `uuid`, `uuid7`                                                                                                       | the `uuid` package                                |
| `ulid`                                                                                                                | the `ulid` package                                |
| `plural`, `singular`, `counted`, `isPlural`, `isSingular`, `pluralStudly`, `pluralPascal`, `matchCase`, `uncountable` | `pluralize`                                       |
| `markdown`, `inlineMarkdown`, `markDownRenderer`                                                                      | `markdown-it`                                     |
| `slug`, `ascii`                                                                                                       | `transliteration`                                 |
| `str`, `of`                                                                                                           | the whole `Stringable` class and its dependencies |
| `collect`                                                                                                             | the `Collection` class and its helpers            |

Rspack alone has two more:

- **`createLang`** (`@tolki/lang` and `@tolki/lang/vue`) leaves dead `@tolki/utils` code under Rspack's default minifier settings. SWC `compress.passes: 3` in `optimization.minimizer` removes it. <!-- scripts/treeshake/expectations.ts, "@tolki/lang:createLang" -->
- **`spell` and `spellOrdinal`** (`@tolki/num`) keep the chunk-loading runtime for the dynamic `import()` of their locale files. <!-- scripts/treeshake/expectations.ts, "@tolki/num:spell" -->

Rollup and webpack drop all of these cleanly.

## Large dependencies

Some imports are big on their own, and no bundler setting changes that, because the code is used when you call them:

- **`slug` and `ascii`** carry `transliteration`, which holds the character tables for every script. Import them only where you need them. <!-- scripts/treeshake/expectations.ts, "@tolki/str:slug" -->
- **`markdown`, `inlineMarkdown` and `markDownRenderer`** carry `markdown-it`.
- **`str` and `of`** return a `Stringable`, a class with every string helper as a method, so a bundle that uses either keeps the whole class and every dependency it uses. For small bundles, import the string functions one by one instead. <!-- scripts/treeshake/expectations.ts, "@tolki/str:str" -->
- **`collect` and `new Collection`** keep the whole `Collection` class.

## Generated enums and routes

The TypeScript publisher writes `/* @__PURE__ */` before every module-level call in the enum and route files it generates, including each call of a curried route, so an unused enum or route drops in all five bundlers. <!-- scripts/treeshake/fixtures.ts, "shape:@tolki/ts:enum-only:call-site-pure" --> <!-- scripts/treeshake/fixtures.ts, "shape:@tolki/ts:annotate-page-props:call-site-pure" -->

A file published by an older version of the package, or by a custom `enums.template` or `routes.template`, may not have the comment. Without it, whether an unused call drops depends on the shape and on the bundler:

| Generated shape                                                                                                    | Rollup  | Rolldown | esbuild | webpack | Rspack  |
| ------------------------------------------------------------------------------------------------------------------ | ------- | -------- | ------- | ------- | ------- |
| An enum alone, or a plain `defineRoute({...})`                                                                     | dropped | dropped  | kept    | dropped | dropped |
| An enum file that also derives a list, as in `values(Status)`                                                      | dropped | dropped  | kept    | dropped | kept    |
| A curried route, `annotatePageProps<T>()(defineRoute({...}))` or `annotateRequestPayload<T>()(defineRoute({...}))` | dropped | kept     | kept    | kept    | dropped |
| Any of the above with `/* @__PURE__ */` on each call                                                               | dropped | dropped  | dropped | dropped | dropped |

<!-- scripts/treeshake/fixtures.ts, "shape:@tolki/ts:enum-only" --> <!-- scripts/treeshake/fixtures.ts, "shape:@tolki/ts:enum-file" --> <!-- scripts/treeshake/fixtures.ts, "shape:@tolki/ts:annotate-page-props" --> <!-- scripts/treeshake/fixtures.ts, "shape:@tolki/ts:annotate-page-props:call-site-pure" -->

A custom route template writes the comment on every call of a curried route, the outer one and the inner `defineRoute`:

```typescript
export const show = /* @__PURE__ */ annotatePageProps<ShowProps>()(
  /* @__PURE__ */ defineRoute({ url: "/users/{user}", methods: ["get"] }),
);
```

The [Enums](/ts/enums#bundling) and [Routing](/ts/routing#bundling) pages show the same notes beside the generated code.

## Where to read more

Each package page has a short Bundling section with its own exceptions:

- [Strings](/strings/#bundling)
- [Numbers](/numbers/#bundling)
- [Arrays & Objects](/arrays-objects/#bundling)
- [Collections](/collections/#bundling)
- [Localization](/localization/#bundling)
- [Enums](/ts/enums#bundling)
- [Routing](/ts/routing#bundling)
