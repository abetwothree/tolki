# Docs site

How the VitePress site in `docs/vitepress` is laid out, and the rules for adding to it. Read this before you write a reference page.

## Layout

| Path                                                   | Holds                                                                            |
| ------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `docs/vitepress/.vitepress/config.ts`                  | Site config: nav, sidebar, search, markdown plugins and the table wrapper.       |
| `docs/vitepress/.vitepress/theme/index.ts`             | Theme entry. Registers `FnTry` and installs the code-group tab sync.             |
| `docs/vitepress/.vitepress/theme/style.css`            | Theme styles, including the `collection-method-list` chip list.                  |
| `docs/vitepress/.vitepress/theme/components/FnTry.vue` | The "Try it" playground. See [fn-try.md](./fn-try.md).                           |
| `docs/vitepress/.vitepress/theme/code-group-sync.ts`   | Tab sync. See [code-group-sync.md](./code-group-sync.md).                        |
| `docs/vitepress/<family>/`                             | The pages of one family.                                                         |
| `docs/stubs/`                                          | Copies of Laravel's docs. Reference material only, never the source of a result. |

## Page families and URLs

| Family           | URLs                                                                                                                                                 | Packages                                  |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Arrays & Objects | `/arrays-objects/`, `/arrays-objects/utilities-list`, `/arrays-objects/dot-notation`, `/arrays-objects/php-semantics`, `/arrays-objects/differences` | `@tolki/arr`, `@tolki/obj`, `@tolki/data` |
| Collections      | `/collections/`, `/collections/methods-list`, `/collections/differences`                                                                             | `@tolki/collection`                       |
| Strings          | `/strings/`, `/strings/string-utilities-list`, `/strings/stringable-utilities-list`                                                                  | `@tolki/str`                              |
| Numbers          | `/numbers/`, `/numbers/number-utilities-list`                                                                                                        | `@tolki/num`                              |
| Localization     | `/localization/`, `/localization/translator`, `/localization/differences`                                                                            | `@tolki/lang`                             |
| TypeScript       | `/ts/…`, `/typescript/…`                                                                                                                             | `@tolki/ts`, `@tolki/types`               |

Arrays and objects share one reference page because `@tolki/data` forwards to the other two. See [arr-obj-data-collection-layering.md](./arr-obj-data-collection-layering.md).

## Nav and sidebar

- The nav is `Home`, `Packages`, `TS & Laravel`, a `Utilities` dropdown, then `TS Types`. The dropdown holds `Strings`, `Numbers`, `Arrays & Objects`, `Collections` and `Localization`, and its `activeMatch` regex is `^/(strings|numbers|arrays-objects|collections|localization)/`, so the dropdown shows as active on every page of those families. Add a new utility family to both the dropdown and that regex.
- Each family has one sidebar group. `Arrays & Objects` and `Collections` come right after `Strings`, and `Localization` comes after `Collections`.
- A sidebar entry is added in the task that creates its page, never earlier. VitePress fails the build on a dead link, and a sidebar link counts.
- The sidebar groups are `Arrays & Objects` (`Installation & Usage`, `Utilities List`, `Dot Notation`, `PHP Semantics`, `Differences from Laravel`), `Collections` (`Installation & Usage`, `Methods List`, `Differences from Laravel`) and `Localization` (`Installation & Usage`, `Translator Reference`, `Differences from Laravel`).

## Authoring conventions

### Links

- Pages that a README includes (`arrays-objects/*`, `collections/*`, `localization/*`) use relative `.md` links such as `./dot-notation.md#wildcards` or `../collections/methods-list.md#pluck`. Never write a root link like `/collections/` there, because `readme:build` rewrites only relative links. See [readme-build.md](./readme-build.md).
- Pages that no README includes (`index.md`, `packages.md`, `config.ts`) use root links.
- Never link to a page that does not exist yet. The task that creates a page adds the links to it. Until then, name the page in plain text.

### Tab titles

A code group that shows one example per package uses the titles `@tolki/arr`, `@tolki/obj` and `@tolki/data`, in that order. `scripts/readme-build.ts` and the tab sync both match these exact strings. Groups with other titles, such as `npm`, `yarn` and `pnpm`, are never synced or filtered.

Prose outside a code group must be true for every tab in it. Anything true for only one package goes inside that tab's fence as a `//` comment, so the README filter removes it with the tab.

### Checked examples

A line `// => <JS expression>` right after an expression statement is checked against the real packages. A multi-line expected value continues on the next `//` lines, so leave a blank line before a plain comment of your own. `// => throws <ErrorName>` checks the thrown error's `name`. Write every result from what the runner proves, never from Laravel's docs or from PHP. See [docs-example-runner.md](./docs-example-runner.md).

Known traps: Collection's `chunk()`, `duplicates()`, `groupBy(key, true)` and `random(n, true)` keep PHP's positional keys, while `chunk()` in arr renumbers. `set`, `forget`, `push`, `pull` and `prepend` in arr, obj and data return a new value and leave their argument unchanged. `dataGet` does not support `*`, `{first}` or `{last}`.

### Parity claims

A statement about what Laravel or PHP does, or how the port differs, carries a citation as an HTML comment: `<!-- docs/php-parity/Collection/chunk.json, "collection-chunk-last-chunk-keys" -->`. So does a translated Laravel example whose port result differs from the one in `docs/stubs`. Put the comment on the line before a block, or at the end of a list item's line. The format and the probes are in `scripts/php-parity/README.md`.

### Section order

Sections inside a list page are alphabetical by heading, case-insensitive, matching Laravel's method lists.

### Utilities list template (Arrays & Objects)

Every section of `arrays-objects/utilities-list.md` uses this shape:

````md
### get

Get an item from an array or object using "dot" notation.

Exported as `get` from `@tolki/arr` and `@tolki/obj`, and as `dataGet` from `@tolki/data`.

Laravel: [`Arr::get()`](https://laravel.com/docs/helpers#method-array-get) · [`data_get()`](https://laravel.com/docs/helpers#method-data-get)

::: code-group

```js [@tolki/arr]
import { get } from "@tolki/arr";

get([{ price: 100 }], "0.price");
// => 100
```

```js [@tolki/obj]
import { get } from "@tolki/obj";

get({ desk: { price: 100 } }, "desk.price");
// => 100
```

```js [@tolki/data]
import { dataGet } from "@tolki/data";

dataGet([{ price: 100 }], "0.price");
// => 100
```

:::

<FnTry label="dataGet" :fn="dataGet" :args="[
  { name: 'data', type: 'json', default: { desk: { price: 100 } } },
  { name: 'key', default: 'desk.price' },
]" />
````

- **Heading:** the `@tolki/arr` name; otherwise the `@tolki/obj` name; otherwise the `data` name without `data`. The exceptions are `arrayable` (obj `objectifiable`) and `arrayItem` (obj `objectItem`, data `dataItem`).
- **Description:** the export's docblock summary line, which is Laravel's wording.
- **"Exported as" line:** required in every section and names every tab's import. Local search does not index code blocks, so without this line a search for `dataGet` or `objectItem` finds nothing. Only packages that have the function are named.
- **`Laravel:` line:** only when `docs/stubs/helpers.md` has an `<a name="method-…">` for the function. Use that anchor on the unversioned `https://laravel.com/docs/helpers` URL.
- **Tabs:** one per package that exports the function, in arr, obj, data order.
- **FnTry:** runs the `data*` variant, or the arr or obj function where data has none. Callback arguments use `select` presets defined once in the page's `<script setup>`. It is optional only for `random` and `shuffle`. Defaults must not throw unless the section is about the throw.
- **`::: info` boxes** are used only for Laravel differences, and each carries a citation.
- **The page** starts with `# Tolki Array & Object Utilities List`, then a `<script setup>` importing what the demos need, a two-sentence intro that names the tabs and says they remember the reader's choice, `## Utilities List` with the `<div class="collection-method-list" markdown="1">` chip list (one chip per section, `[get](#get)`), then `## Utilities Details`.

### Methods list template (Collections)

Every section of `collections/methods-list.md` uses this shape:

````md
### chunk

Break the collection into multiple, smaller collections of a given size.

Laravel: [`chunk()`](https://laravel.com/docs/collections#method-chunk)

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3, 4, 5]).chunk(2).toArray();
// => [{ 0: 1, 1: 2 }, { 2: 3, 3: 4 }, { 4: 5 }]
```

<FnTry label="collect(items).chunk(size)" :fn="(items, size) => collect(items).chunk(size)" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3, 4, 5] },
  { name: 'size', type: 'number', default: 2 },
]" />
````

- **Heading:** the member name. Static members say "The static `make` method…" in the description. Name the symbol members `Symbol.iterator` and `Symbol.toPrimitive`. `toJSON` goes right after `toJson`, and their chip anchors are `#tojson` and `#tojson-1`.
- **Description:** from the method's docblock and `docs/stubs/collections.md`.
- **`Laravel:` line:** only when `docs/stubs/collections.md` has an anchor for the method.
- **Examples** end in `.all()` or `.toArray()`. Use `.toArray()` when the items are collections.
- **In-place methods** get Laravel's `::: warning` box ("Unlike most other collection methods, `forget` does not return a new modified collection; it modifies and returns the collection it is called on."), confirmed by an example that reads the original afterwards. Add the method to the in-place list in `collections/index.md`.
- **JS-only members** (`length`, `Symbol.iterator`, `Symbol.toPrimitive`, `toJSON` and the extras on the differences page) get `<Badge type="info" text="JS only" />` on the line after the heading, never in it, so the anchor stays clean.
- **Shared rules** live on the concept pages. A method that follows one links to it and does not restate it: `where` links to `../arrays-objects/php-semantics.md#loose-and-strict-comparison`, and `pluck` to `../arrays-objects/dot-notation.md`.
- **FnTry** is required except for `random`, `shuffle`, `dump`, `mapInto`, `pipeInto`, `whereInstanceOf` and `ensure` with class arguments.
- **The page** starts with `# Tolki Collection Methods List`, then a `<script setup>` importing `collect`, `Collection` and the callback presets, `## Methods List` with the chip list, then `## Methods Details`.

## `tolki.docs`

A package's `package.json` lists the pages that its README includes under `tolki.docs`, as paths relative to `docs/vitepress/`. `readme:build` splices them in, keeping only that package's own tabs. See [readme-build.md](./readme-build.md).

```json
"tolki": {
    "docs": ["strings/index.md", "strings/string-utilities-list.md"]
}
```

## Verification commands

```bash
pnpm docs:build                                   # the site builds with no dead links
npx vitest run --project scripts docs-examples    # every // => assertion holds
npx vitest run --project scripts                  # the scripts' own tests, including citations
npx vitest run --project docs                     # the theme's tests
pnpm docs:coverage                                # exports and members without a section
pnpm docs:dev --port 5174                         # check a page in a browser
pnpm lint
npx prettier --check docs
```

`pnpm docs:coverage` accepts `--page` and `--only` to scope the check while a page is partial. See [docs-coverage.md](./docs-coverage.md).
