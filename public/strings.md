---
url: /strings.md
---
# String Utilities Installation

The [`@tolki/str`](https://www.npmjs.com/package/@tolki/str) package provides a variety of string manipulation utilities inspired by Laravel's Str class. You can install it via npm, yarn, or pnpm:

::: code-group

```bash [npm]
npm install @tolki/str
```

```bash [yarn]
yarn add @tolki/str
```

```bash [pnpm]
pnpm add @tolki/str
```

:::

## Importing the Package

You can import individual functions or the whole package as a namespace. Both tree-shake the same way:

Importing individual functions:

```typescript
// Import individual functions
import { camel, chopEnd } from "@tolki/str";

// Example usage
const camelCaseString = camel("hello world"); // 'helloWorld'
const choppedString = chopEnd("HelloWorld", 5); // 'Hello'
```

Importing the package as a namespace:

```typescript
// Import the package as a namespace
import * as Str from "@tolki/str";

// Example usage
const camelCaseString = Str.camel("hello world"); // 'helloWorld'
const choppedString = Str.chopEnd("HelloWorld", 5); // 'Hello'
```

A namespace import that reads its members by name, such as `Str.camel(...)`, shakes exactly like named imports in Rollup, Rolldown (Vite 8), esbuild, webpack and Rspack: your bundle holds only the members you use. Passing the namespace object around, or reading a computed member such as `Str[name]`, keeps every function. See [Bundling and Tree-Shaking](https://tolki.abe.dev/tree-shaking.html#namespace-imports).

## Bundling

A helper call whose result nothing uses drops out of your bundle in Rollup, Rolldown (Vite 8), webpack and Rspack, because the helpers are marked as free of side effects. This holds for a call at the top level of a module too.

The exception is Vite 8 (Rolldown) and Rspack, where an unused top-level call to `uuid`, `uuid7`, `ulid`, `slug`, `ascii`, `markdown`, `inlineMarkdown`, `markDownRenderer`, `str`, `of`, `plural`, `singular`, `counted`, `isPlural`, `isSingular`, `pluralStudly`, `pluralPascal`, `matchCase` or `uncountable` drops the call but can keep the code of the package behind it (uuid, ulid, pluralize, markdown-it, transliteration). Writing `/* @__PURE__ */` before the call drops everything:

```typescript
export const id = /* @__PURE__ */ uuid();
```

esbuild doesn't follow the mark across files, so it needs the same comment on any helper call. [Bundling and Tree-Shaking](https://tolki.abe.dev/tree-shaking.html) covers every bundler.

The functions that set or clear a generator or the casing caches (`createRandomStringsUsing`, `createUuidsUsing`, `createUlidsUsing`, `freezeUuids`, `freezeUlids`, `flushCache`, `resetFactoryState` and the other `create*` helpers) change module state, and so does `inflector`, which registers the pluralizer's rules on the shared `pluralize` instance. A call to any of them is always kept.
