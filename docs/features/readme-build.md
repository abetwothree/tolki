# README build

`scripts/readme-build.ts` splices VitePress pages into each package's `README.md`. It runs as `pnpm run readme:build` in every package's `prepack`.

## Pipeline

1. A package lists pages in `package.json` under `tolki.docs`, as paths relative to `docs/vitepress/`.
2. The script keeps everything in the README before `<!-- AUTO-GENERATED-DOCS:START -->`. With no sentinel, it appends at the end.
3. For each page, `assembleDocsContent(docFiles, packageName)` runs these steps in order:
   1. `filterPackageVariants` keeps only the package's own tabs.
   2. `rewriteAnchorsForGitHub` rewrites in-page `](#slug)` links to GitHub's slugs.
   3. `stripVitepressSyntax` does the rest in one call:
      1. It removes frontmatter.
      2. It runs `rewriteRelativeDocLinks` to make doc links absolute, only when the page's `docDir` is non-empty (a page directly under `docs/vitepress/` keeps its relative links).
      3. It removes `:::` lines, `<div>` wrappers, `<script setup>` blocks and Vue component tags.
      4. It runs `increaseHeadingLevels` to push headings down one level.
      5. Three or more blank lines collapse to two.
4. The cleaned pages are joined with a blank line. The result replaces everything between the start sentinel and `<!-- AUTO-GENERATED-DOCS:END -->`.

The filter runs first because it needs the `:::` lines that `stripVitepressSyntax` removes.

## Variant filter

A page can document several packages in one place. Each section holds a code group with one tab per package:

````md
### get

[get](#get) links here.

::: code-group

```ts [@tolki/arr]
import { get } from "@tolki/arr";
```

```ts [@tolki/obj]
import { get } from "@tolki/obj";
```

:::
````

A code group is a **variant group** when every titled fence in it has a title that starts with `@tolki/`. Groups with other titles, such as `npm`, `yarn` and `pnpm`, are never touched.

In a variant group, the filter keeps only the fence titled with the package name. For `@tolki/obj`, the example above keeps the `@tolki/obj` tab.

If a variant group has no tab for the package, the filter drops the section that holds it. A section runs from its heading to the line before the next heading of the same or a higher level, so it takes its subsections along. Headings inside fences do not count. If no heading comes before the group, only the group is dropped.

A dropped section also loses every `[text](#slug)` link that points at it, plus one adjacent space, so a chip row such as `[a](#a) [count](#count) [b](#b)` stays tidy. Slugs are computed on the unfiltered page with `parseHeadings`, so VitePress's `-1` suffixes for duplicate headings stay correct. Links inside fences are left alone.

A page with no variant group comes back byte-identical. `scripts/__tests__/readme-build.test.ts` checks this against the string, number, TypeScript and `ts` pages, so every README that exists today is unchanged.

## Link rewrite

`rewriteRelativeDocLinks` turns relative `.md` links into site URLs, because a README on npm or GitHub cannot resolve them:

| Source link                             | README link                                             |
| --------------------------------------- | ------------------------------------------------------- |
| `[x](./foo.md#bar)` in `ts/`            | `https://tolki.abe.dev/ts/foo.html#bar`                 |
| `[x](../collections/methods-list.md#a)` | `https://tolki.abe.dev/collections/methods-list.html#a` |

The `./` form uses the directory of the page that holds the link. The `../<dir>/` form names the directory itself. Never write root links such as `/collections/` in a page that a README includes, because the rewrite does not touch them.

## Anchor rewrite

VitePress turns `Symbol.iterator` into `#symbol-iterator`, but GitHub and npm drop the dot and give `#symboliterator`. `rewriteAnchorsForGitHub` computes both slugs for every heading outside fences, `-N` duplicate suffixes included, and rewrites each in-page `](#slug)` link to the GitHub one. It runs after the variant filter and before VitePress syntax is stripped. Links to unknown slugs and links inside fences are left alone.

Known limit: the `-N` duplicate suffix is computed per source file, while a README joins three to five files, so two same-named headings in different pages both get the plain slug on GitHub.

## Publish path

`prepack` runs `readme:build` before `build` for each package. In `.github/workflows/publish.yml`, the step `Commit readme updates` uses `stefanzweifel/git-auto-commit-action` to commit the regenerated READMEs after a release, with the message `docs: update readme with new version [skip ci]`.

## Out of scope

Issue #80 reports that the `@tolki/ts` README already drifts from its pages. This work does not regenerate it, and does not fix that drift.
