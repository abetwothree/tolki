# Array & Object Utilities Installation

Three packages cover Laravel's `Arr` class and `data_*` helpers: [`@tolki/arr`](https://www.npmjs.com/package/@tolki/arr) for arrays, [`@tolki/obj`](https://www.npmjs.com/package/@tolki/obj) for plain objects, and [`@tolki/data`](https://www.npmjs.com/package/@tolki/data), which picks between the two at runtime. You can install any of them via npm, yarn, or pnpm:

::: code-group

```bash [@tolki/arr]
# npm
npm install @tolki/arr

# pnpm
pnpm add @tolki/arr

# yarn
yarn add @tolki/arr
```

```bash [@tolki/obj]
# npm
npm install @tolki/obj

# pnpm
pnpm add @tolki/obj

# yarn
yarn add @tolki/obj
```

```bash [@tolki/data]
# npm
npm install @tolki/data

# pnpm
pnpm add @tolki/data

# yarn
yarn add @tolki/data
```

:::

## Choosing a package

The packages share almost all of their helpers, so the choice comes down to what your data looks like. `@tolki/data` depends on the other two, so installing it also installs them.

| Package                                                    | Works on                                         | Function names                      | Pick it when                                                         |
| ---------------------------------------------------------- | ------------------------------------------------ | ----------------------------------- | -------------------------------------------------------------------- |
| [`@tolki/arr`](https://www.npmjs.com/package/@tolki/arr)   | Arrays                                           | `get`, `first`, `pluck`             | Your data is always a list.                                          |
| [`@tolki/obj`](https://www.npmjs.com/package/@tolki/obj)   | Plain objects                                    | `get`, `first`, `pluck`             | Your data is always a keyed record.                                  |
| [`@tolki/data`](https://www.npmjs.com/package/@tolki/data) | Arrays, plain objects and Maps, decided per call | `dataGet`, `dataFirst`, `dataPluck` | The shape is only known at runtime, as with parsed JSON or API data. |

`@tolki/arr` and `@tolki/obj` use the same names for the helpers they share, so switching between them usually means changing the import. A few exist in only one or two packages: `flattenDot` is only in `@tolki/obj`, and `count`, `search`, `before` and `after` are only in `@tolki/data`. `@tolki/data` prefixes its names with `data`, so they can sit next to either package without a clash. [Differences from Laravel](./differences.md) lists what the three packages leave out, rename or add.

## How `@tolki/data` decides

Every `data*` helper looks at its first argument and forwards the call:

- An array goes to the matching `@tolki/arr` helper. So does anything else that is a list of values, such as a `Set` or a generator.
- A plain object or a `Map` goes to the matching `@tolki/obj` helper.

The return types follow the same split. `dataGet` is typed as the two packages' `get` types combined, so TypeScript answers with the array result for an array and the object result for an object.

## Importing the Package

You can import individual functions for better tree-shaking or the entire package (not recommended). Each tab below imports from its own package and checks one small call:

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

dataGet({ desk: { price: 100 } }, "desk.price");
// => 100
```

:::

Import only the functions you use. Importing the entire package with `import * as Arr from "@tolki/arr"` is not recommended: it can pull every function into your bundle, even the ones you never call, which makes the bundles larger. Importing individual functions lets your build ship only the code that runs.

However, if you are working on a backend project where bundle size is not a concern, importing the entire package can be more convenient.

## How to read the utilities list

The utilities list has one section per function. Each section has one tab per package that exports it, in the order `@tolki/arr`, `@tolki/obj`, `@tolki/data`. A function that only some packages have shows only those tabs.

The tabs follow your choice. Pick `@tolki/obj` once and every section on the page, and the install and import examples above, switch to it. Your pick is remembered the next time you visit.

## More documentation

- [Dot Notation](./dot-notation.md) explains the `"user.address.city"` paths that `get`, `set`, `pluck` and others read, and where a `*` works.
- [PHP Semantics](./php-semantics.md) explains the PHP rules the packages keep: loose comparison, truthiness, key casting and the exceptions they throw.
- [Differences from Laravel](./differences.md) lists where the packages return a value instead of changing a reference, behave differently, leave a function out, rename it or add one.
