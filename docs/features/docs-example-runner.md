# Docs example runner

`scripts/docs-examples.ts` runs the code examples in the docs against the real `@tolki/*` packages, so a documented result can never drift from what the port does. `scripts/docs-markdown.ts` is the fence-aware Markdown reader it builds on.

## Assertion grammar

Only a fenced block (`js`, `javascript`, `ts` or `typescript`) with at least one `// =>` runs. Every other block is left alone.

```js
import { get } from "@tolki/arr";

get([{ price: 100 }], "0.price");
// => 100

JSON.parse("{");
// => throws SyntaxError
```

- `// => <expression>` goes on the line right after an expression statement. The value of that statement is compared with the expression.
- A multi-line expected value continues on the next `//` lines, which are joined with the first. A plain `//` comment directly below an assertion is read as part of it, so leave a blank line before a comment of your own.
- `// => throws <ErrorName>` passes when the statement throws an error whose `name` is `<ErrorName>`, and fails when it throws nothing or something else.
- `// => ` after a `const` declaration, or any statement that is not an expression, is a compile error naming `file:line`.
- Random output gets a plain comment such as `// e.g. [3, 1, 2]`, which is never checked.

## How compilation works

`compileExample` parses the block with the TypeScript compiler API. Each import becomes a read from a table of loaded modules (`import { get as g } from "@tolki/arr"` becomes `const { get: g } = __m["@tolki/arr"]`). Each asserted statement becomes a call to `__expect` or `__throws`. The result is transpiled to ES2022 and run inside an async function, so `await` works in a statement without an assertion. An asserted expression is wrapped in a non-async arrow, so `await` inside one is a `SyntaxError`. `runExample` loads the modules, runs the body, and fails with `file.md:LINE` for the first assertion that does not hold.

## How values are compared

Both sides go through `orderedShape` before `toEqual`, because plain deep equality ignores things this port is careful about:

- Entry order. `{ a: 1, b: 2 }` and `{ b: 2, a: 1 }` differ, and so do Maps and Sets in a different insertion order. Order matters because PHP arrays are ordered and a reader copying an example expects the same keys in the same order.
- The type of a primitive. `1` and `"1"` differ, `-0` and `0` differ, `NaN` and `null` differ.
- A null-prototype object reads like a plain one. A `Date` compares by its ISO string.

## What it covers

The suite `documented examples > runs every documented example` globs `docs/vitepress/arrays-objects/**/*.md`, `docs/vitepress/collections/**/*.md` and `scripts/__tests__/fixtures/docs-examples.md`. A missing directory holds no files. Each example is a test named `file:line`.

Run the suite, or narrow it to one page, with the file name as a filter:

```bash
npx vitest run --project scripts docs-examples
npx vitest run --project scripts docs-examples -t "arrays-objects/dot-notation"
```

It cannot check a class instance or a function: `orderedShape` throws a `TypeError` asking for `.all()` or `.toArray()` first. It cannot check random output either.

## Parity claims

A docs page needs a PHP citation in two cases: when it states what Laravel or PHP does (or how the port differs), and when a translated Laravel example gives a different result from the one printed in Laravel's docs. Write the citation as an HTML comment that readers never see. Put it on the line before a block, or at the end of a list item's line:

```md
<!-- docs/php-parity/Collection/chunk.json, "collection-chunk-last-chunk-keys" -->
```

`scripts/__tests__/php-parity.test.ts` reads these comments from the Markdown under `docs/vitepress/arrays-objects` and `docs/vitepress/collections`. It checks that each cited transcript exists, that each quoted string is a label recorded by a transcript the comment cites, and that a comment names at least one label. The citation format, the transcripts and how to add a probe are defined in [scripts/php-parity/README.md](../../scripts/php-parity/README.md).
