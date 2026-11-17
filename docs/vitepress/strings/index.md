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

You can import individual functions for better tree-shaking or the entire package (not recommended).:

Importing individual functions:

```typescript
// Import individual functions
import { camel, chopEnd } from "@tolki/str";

// Example usage
const camelCaseString = camel("hello world"); // 'helloWorld'
const choppedString = chopEnd("HelloWorld", 5); // 'Hello'
```

Importing the entire package:

```typescript
// Import the entire package (not recommended for tree-shaking)
import * as Str from "@tolki/str";

// Example usage
const camelCaseString = Str.camel("hello world"); // 'helloWorld'
const choppedString = Str.chopEnd("HelloWorld", 5); // 'Hello'
```

The reason that importing the entire package is not recommended is that it will include all functions in your bundle, even the ones you don't use, which can lead to larger bundle sizes. Importing individual functions allows your end files to only include the code that is actually used, resulting in smaller and more efficient bundles.

However, if you are working on a backend project where bundle size is not a concern, importing the entire package can be more convenient.

## Bundling

A helper call whose result nothing uses drops out of your bundle in Rollup and webpack, because the helpers are marked as free of side effects. This holds for a call at the top level of a module too.

In Vite 8 (Rolldown) and Rspack, an unused top-level call to `uuid`, `uuid7`, `ulid`, `slug`, `ascii`, `markdown`, `inlineMarkdown`, `markDownRenderer`, `str`, `of`, `plural`, `singular`, `counted`, `isPlural`, `isSingular`, `pluralStudly`, `pluralPascal`, `matchCase` or `uncountable` drops the call but can keep the code of the package behind it (uuid, ulid, pluralize, markdown-it, transliteration). Writing `/* @__PURE__ */` before the call drops everything:

```typescript
export const id = /* @__PURE__ */ uuid();
```

esbuild doesn't follow the mark across files, so it needs the same comment on any helper call.

The functions that set or clear a generator or the casing caches (`createRandomStringsUsing`, `createUuidsUsing`, `createUlidsUsing`, `freezeUuids`, `freezeUlids`, `flushCache`, `resetFactoryState`, `inflector` and the other `create*` helpers) change module state, so a call to them is always kept.
