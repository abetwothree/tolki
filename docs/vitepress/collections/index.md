# Collection Utilities Installation

The [`@tolki/collection`](https://www.npmjs.com/package/@tolki/collection) package provides a fluent `Collection` class inspired by Laravel's `Collection`. You can install it via npm, yarn, or pnpm:

::: code-group

```bash [npm]
npm install @tolki/collection
```

```bash [yarn]
yarn add @tolki/collection
```

```bash [pnpm]
pnpm add @tolki/collection
```

:::

## Creating collections

There are three ways to create a collection, and they build the same thing. Read the items back with `all()` or `toArray()`:

```js
import { Collection, collect } from "@tolki/collection";

collect([1, 2, 3]).all();
// => [1, 2, 3]

Collection.make([1, 2, 3]).all();
// => [1, 2, 3]

new Collection([1, 2, 3]).all();
// => [1, 2, 3]
```

`collect()` and `Collection.make()` also type results that the constructor cannot, such as the keys of a `Map`. Prefer one of them in TypeScript.

## Lists and keyed collections

A collection holds either a list or a keyed record. An array makes a list, and a plain object or a `Map` makes a keyed collection:

```js
import { collect } from "@tolki/collection";

collect(["a", "b"]).all();
// => ["a", "b"]

collect({ first: "a", second: "b" }).all();
// => { first: "a", second: "b" }
```

In TypeScript the class is `Collection<TValue, TKey, TShape>`. `TValue` is the item type and `TKey` the key type. `TShape` is `"list"`, `"keyed"` or `"partial"`: a list, a record that holds every key its type names, or one that may lack some. It defaults from the key type, so number keys give a list and any other key gives a keyed record. You rarely write it yourself, because `collect()` infers it.

## Methods that change the collection in place

Most methods return a new collection. The few that change the collection they are called on are listed here. Most also return it. `getOrPut` returns the value it found or stored, `pull` the item it removed, `pop` and `shift` the item or items they removed, `splice` the items it removed, and `offsetSet` and `offsetUnset` return nothing.

- [`add`](./methods-list.md#add)
- [`escapeWhenCastingToString`](./methods-list.md#escapewhencastingtostring)
- [`forget`](./methods-list.md#forget)
- [`getOrPut`](./methods-list.md#getorput)
- [`offsetSet`](./methods-list.md#offsetset)
- [`offsetUnset`](./methods-list.md#offsetunset)
- [`pop`](./methods-list.md#pop)
- [`prepend`](./methods-list.md#prepend)
- [`pull`](./methods-list.md#pull)
- [`push`](./methods-list.md#push)
- [`put`](./methods-list.md#put)
- [`shift`](./methods-list.md#shift)
- [`splice`](./methods-list.md#splice)
- [`transform`](./methods-list.md#transform)
- [`unshift`](./methods-list.md#unshift)

## Bundling

A `collect(...)` call whose result nothing uses drops out of your bundle in Rollup, Rolldown (Vite 8), webpack and Rspack, including a call at the top level of a module. `collect()` only builds a new collection, so removing the call changes nothing.

`Collection` is a class, and a bundler can't mark a constructor. A top-level `new Collection(...)` stays in the bundle unless the call site says it is safe to remove:

```typescript
export const prices = /* @__PURE__ */ new Collection([1, 2, 3]);
```

The exception is Vite 8 (Rolldown) and Rspack, where an unused top-level `collect(...)` call drops the call but can keep the `Collection` class; writing `/* @__PURE__ */` before the call drops everything. esbuild doesn't follow the mark on `collect()` across files either, so it keeps that call unless the call site carries the same comment.

## More documentation

- The [Methods List](./methods-list.md) page documents every method with a live example.
- The [Differences from Laravel](./differences.md) page lists where the class departs from Laravel's, and why.
- Methods that take a path such as `pluck` read it as "dot" notation. The [Dot Notation](../arrays-objects/dot-notation.md) page of [Arrays & Objects](../arrays-objects/index.md) explains the rules.
