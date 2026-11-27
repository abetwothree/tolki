---
url: /numbers.md
---
# Number Utilities Installation

The [`@tolki/num`](https://www.npmjs.com/package/@tolki/num) package provides a variety of number manipulation utilities inspired by Laravel's Num class. You can install it via npm, yarn, or pnpm:

::: code-group

```bash [npm]
npm install @tolki/num
```

```bash [yarn]
yarn add @tolki/num
```

```bash [pnpm]
pnpm add @tolki/num
```

:::

## Importing the Package

You can import individual functions or the whole package as a namespace. Both tree-shake the same way:

Importing individual functions:

```typescript
// Import individual functions
import { format, parse } from "@tolki/num";

// Example usage
const formattedNumber = format(1234567.89); // '1,234,567.89'
const parsedNumber = parse("1,234,567.89"); // 1234567.89
```

Importing the package as a namespace:

```typescript
// Import the package as a namespace
import * as Num from "@tolki/num";

// Example usage
const formattedNumber = Num.format(1234567.89); // '1,234,567.89'
const parsedNumber = Num.parse("1,234,567.89"); // 1234567.89
```

A namespace import that reads its members by name, such as `Num.format(...)`, shakes exactly like named imports in Rollup, Rolldown (Vite 8), esbuild, webpack and Rspack: your bundle holds only the members you use. Passing the namespace object around, or reading a computed member such as `Num[name]`, keeps every function. See [Bundling and Tree-Shaking](https://tolki.abe.dev/tree-shaking.html#namespace-imports).

## Bundling

A helper call whose result nothing uses drops out of your bundle in Rollup, Rolldown (Vite 8), webpack and Rspack, because the helpers are marked as free of side effects. This holds for a call at the top level of a module too.

The exception is Rspack, where an unused top-level call to `spell` or `spellOrdinal` drops the call but keeps the loader code it needs for the dynamic `import()` of the `to-words` locale files. Writing `/* @__PURE__ */` before the call drops everything:

```typescript
export const words = /* @__PURE__ */ spell(5);
```

esbuild doesn't follow the mark across files, so it needs the same comment on any helper call. [Bundling and Tree-Shaking](https://tolki.abe.dev/tree-shaking.html) covers every bundler.

`useLocale` and `useCurrency` set the defaults that every formatter reads, and `withLocale` and `withCurrency` run a callback around a temporary swap of them. `normalizeLocalesUsing` sets how every formatter converts a locale. A call to any of the five is always kept.
