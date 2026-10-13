# Docs coverage checker

`scripts/docs-coverage.ts` proves the list pages cover the packages. Content tasks run it after each batch of sections.

## What counts as documented

- `arrays-objects/utilities-list.md` documents a `@tolki/arr`, `@tolki/obj` or `@tolki/data` export when a code-group tab titled `@tolki/<pkg>` imports it from `"@tolki/<pkg>"`. Aliased imports count under the original export name.
- `collections/methods-list.md` documents a `Collection` member when a `###` heading's text equals its name. A computed `[Symbol.iterator]` is written `Symbol.iterator`.
- A page that does not exist yet reports every one of its names as missing. It never throws.

## Why it reads the TypeScript AST

Exports and members come from `ts.createSourceFile`, not from importing the package. A TypeScript `private` or `protected` method still exists on the prototype at runtime, so a runtime listing would demand docs for internals. The checker skips them, along with the constructor.

## Other checks

- A broken anchor is a `](#slug)` link outside a fence with no heading of that slug. Duplicate headings get VitePress's `-1`, `-2` suffixes.
- A fence mismatch is a tab titled `@tolki/x` that imports from any other `@tolki/*` module.

## CLI

```bash
pnpm docs:coverage [--page arrays-objects|collections] [--only a,b,c]
```

One issue per line, then exit code 1 if any were printed:

```text
missing <page> <owner> <name>
anchor <page>:<line> #<slug>
fence <page>:<line> <title> imports <module>
```

An unknown `--page` value prints a usage line to stderr and exits 2. Pages are relative to `docs/vitepress/`. `owner` is `arr`, `obj`, `data` or `collection`.

## Using `--only`

`--only` limits `missing` lines to those names, so a content task checks just the sections it wrote while the pages are partial. Anchor and fence issues are always reported. A name matches an export or member exactly. For `@tolki/data` it also matches the export without its `data` prefix, so `--only get` reports `dataGet` as well as arr `get`, obj `get` and Collection `get`.

## Using `--page`

`--page arrays-objects` or `--page collections` keeps only the issues (missing, anchor and fence) of that section's page. Content tasks write one page at a time, so they run `pnpm docs:coverage --page <page> --only <names>`.
