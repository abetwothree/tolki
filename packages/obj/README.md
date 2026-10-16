<p align="center"><img src="https://raw.githubusercontent.com/abetwothree/tolki/refs/heads/master/docs/vitepress/public/tolki-logo-short.svg" width="50%" alt="Laravel Tolki JS Logo"></p>

# Tolki JS Obj Package

This package provides object utility functions similar to Laravel's Arr class facade for working with JavaScript objects.

## Documentation

The full documentation for the object utilities can be found at [https://tolki.abe.dev](https://tolki.abe.dev/arrays-objects/).

<!-- AUTO-GENERATED-DOCS:START -->

## Array & Object Utilities Installation

Three packages cover Laravel's `Arr` class and `data_*` helpers: [`@tolki/arr`](https://www.npmjs.com/package/@tolki/arr) for arrays, [`@tolki/obj`](https://www.npmjs.com/package/@tolki/obj) for plain objects, and [`@tolki/data`](https://www.npmjs.com/package/@tolki/data), which picks between the two at runtime. You can install any of them via npm, yarn, or pnpm:

```bash [@tolki/obj]
# npm
npm install @tolki/obj

# pnpm
pnpm add @tolki/obj

# yarn
yarn add @tolki/obj
```

### Choosing a package

The packages share almost all of their helpers, so the choice comes down to what your data looks like. `@tolki/data` depends on the other two, so installing it also installs them.

| Package                                                    | Works on                                         | Function names                      | Pick it when                                                         |
| ---------------------------------------------------------- | ------------------------------------------------ | ----------------------------------- | -------------------------------------------------------------------- |
| [`@tolki/arr`](https://www.npmjs.com/package/@tolki/arr)   | Arrays                                           | `get`, `first`, `pluck`             | Your data is always a list.                                          |
| [`@tolki/obj`](https://www.npmjs.com/package/@tolki/obj)   | Plain objects                                    | `get`, `first`, `pluck`             | Your data is always a keyed record.                                  |
| [`@tolki/data`](https://www.npmjs.com/package/@tolki/data) | Arrays, plain objects and Maps, decided per call | `dataGet`, `dataFirst`, `dataPluck` | The shape is only known at runtime, as with parsed JSON or API data. |

`@tolki/arr` and `@tolki/obj` use the same names for the helpers they share, so switching between them usually means changing the import. A few exist in only one or two packages: `flattenDot` is only in `@tolki/obj`, and `count`, `search`, `before` and `after` are only in `@tolki/data`. `@tolki/data` prefixes its names with `data`, so they can sit next to either package without a clash. [Differences from Laravel](https://tolki.abe.dev/arrays-objects/differences.html) lists what the three packages leave out, rename or add.

### How `@tolki/data` decides

Every `data*` helper looks at its first argument and forwards the call:

- An array goes to the matching `@tolki/arr` helper. So does anything else that is a list of values, such as a `Set` or a generator.
- A plain object or a `Map` goes to the matching `@tolki/obj` helper.

The return types follow the same split. `dataGet` is typed as the two packages' `get` types combined, so TypeScript answers with the array result for an array and the object result for an object.

### Importing the Package

You can import individual functions for better tree-shaking or the entire package (not recommended). On the docs site, each tab below imports from its own package and checks one small call:

```js [@tolki/obj]
import { get } from "@tolki/obj";

get({ desk: { price: 100 } }, "desk.price");
// => 100
```

Import only the functions you use. Importing the entire package with `import * as Arr from "@tolki/arr"` is not recommended: it can pull every function into your bundle, even the ones you never call, which makes the bundles larger. Importing individual functions lets your build ship only the code that runs.

However, if you are working on a backend project where bundle size is not a concern, importing the entire package can be more convenient.

### How to read the utilities list

The [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html) has one section per function. Each section has one tab per package that exports it, in the order `@tolki/arr`, `@tolki/obj`, `@tolki/data`. A function that only some packages have shows only those tabs.

On the docs site, the tabs follow your choice. Pick `@tolki/obj` once and every section on the page, and the install and import examples above, switch to it. Your pick is remembered the next time you visit.

### More documentation

- [Dot Notation](https://tolki.abe.dev/arrays-objects/dot-notation.html) explains the `"user.address.city"` paths that `get`, `set`, `pluck` and others read, and where a `*` works.
- [PHP Semantics](https://tolki.abe.dev/arrays-objects/php-semantics.html) explains the PHP rules the packages keep: loose comparison, truthiness, key casting and the exceptions they throw.
- [Differences from Laravel](https://tolki.abe.dev/arrays-objects/differences.html) lists where the packages return a value instead of changing a reference, behave differently, leave a function out, rename it or add one.

## Tolki Array & Object Utilities List

These utilities work on arrays with `@tolki/arr`, on plain objects with `@tolki/obj`, and on either one with `@tolki/data`. On the docs site, every section has a tab for each package that exports the function, and the page remembers the tab you pick, so the next visit starts on the same one.

### Utilities List

[accessible](#accessible) [add](#add) [arrayable](#arrayable) [arrayItem](#arrayitem) [boolean](#boolean) [chunk](#chunk) [chunkBy](#chunkby) [chunkWhile](#chunkwhile) [collapse](#collapse) [combine](#combine) [contains](#contains) [containsStrict](#containsstrict) [crossJoin](#crossjoin) [diff](#diff) [diffAssoc](#diffassoc) [diffAssocUsing](#diffassocusing) [diffKeys](#diffkeys) [diffKeysUsing](#diffkeysusing) [diffUsing](#diffusing) [divide](#divide) [dot](#dot) [every](#every) [except](#except) [exceptValues](#exceptvalues) [exists](#exists) [filter](#filter) [first](#first) [flatten](#flatten) [flattenDot](#flattendot) [flip](#flip) [float](#float) [forget](#forget) [from](#from) [get](#get) [has](#has) [hasAll](#hasall) [hasAny](#hasany) [integer](#integer) [intersect](#intersect) [intersectAssoc](#intersectassoc) [intersectAssocUsing](#intersectassocusing) [intersectByKeys](#intersectbykeys) [intersectUsing](#intersectusing) [join](#join) [keyBy](#keyby) [keys](#keys) [last](#last) [map](#map) [mapSpread](#mapspread) [mapWithKeys](#mapwithkeys) [only](#only) [onlyValues](#onlyvalues) [pad](#pad) [partition](#partition) [pluck](#pluck) [pop](#pop) [prepend](#prepend) [prependKeysWith](#prependkeyswith) [pull](#pull) [push](#push) [query](#query) [random](#random) [reject](#reject) [replace](#replace) [replaceRecursive](#replacerecursive) [reverse](#reverse) [select](#select) [set](#set) [shift](#shift) [shuffle](#shuffle) [skipUntil](#skipuntil) [skipWhile](#skipwhile) [slice](#slice) [sole](#sole) [some](#some) [sort](#sort) [sortDesc](#sortdesc) [sortRecursive](#sortrecursive) [sortRecursiveDesc](#sortrecursivedesc) [splice](#splice) [string](#string) [take](#take) [takeUntil](#takeuntil) [takeWhile](#takewhile) [toCssClasses](#tocssclasses) [toCssStyles](#tocssstyles) [undot](#undot) [union](#union) [unshift](#unshift) [values](#values) [where](#where) [whereNotNull](#wherenotnull) [wrap](#wrap)

### Utilities Details

#### accessible

Determine whether the given value is array accessible: a list in `@tolki/arr`, a plain object or a `Map` in `@tolki/obj`.

Exported as `accessible` from `@tolki/arr` and `@tolki/obj`.

Laravel: [`Arr::accessible()`](https://laravel.com/docs/helpers#method-array-accessible)

```js [@tolki/obj]
import { accessible } from "@tolki/obj";

accessible({ a: 1, b: 2 });
// => true

accessible(new Map([["a", 1]]));
// => true

accessible([1, 2]);
// => false

accessible("abc");
// => false
```

#### add

Add an element using "dot" notation if it doesn't exist. A key that is missing or set to `null` counts as not existing.

Exported as `add` from `@tolki/arr` and `@tolki/obj`, and as `dataAdd` from `@tolki/data`.

Laravel: [`Arr::add()`](https://laravel.com/docs/helpers#method-array-add)

```js [@tolki/obj]
import { add } from "@tolki/obj";

add({ name: "Desk" }, "price", 100);
// => { name: "Desk", price: 100 }

add({ name: "Desk", price: null }, "price", 100);
// => { name: "Desk", price: 100 }

add({ name: "Desk", price: 50 }, "price", 100);
// => { name: "Desk", price: 50 }
```

#### arrayable

Determine whether the given value is arrayable: a list in `@tolki/arr`, a plain object in `@tolki/obj`.

Exported as `arrayable` from `@tolki/arr` and as `objectifiable` from `@tolki/obj`.

```js [@tolki/obj]
import { objectifiable } from "@tolki/obj";

objectifiable({ a: 1 });
// => true

objectifiable([1, 2]);
// => false

objectifiable(new Date());
// => false
```

#### arrayItem

Get an item using "dot" notation, throwing an `InvalidArgumentException` unless it is a list (`@tolki/arr`) or a plain object (`@tolki/obj`). `dataItem` expects the kind that matches its first argument.

Exported as `arrayItem` from `@tolki/arr`, as `objectItem` from `@tolki/obj` and as `dataItem` from `@tolki/data`.

Laravel: [`Arr::array()`](https://laravel.com/docs/helpers#method-array-array)

```js [@tolki/obj]
import { objectItem } from "@tolki/obj";

objectItem({ desk: { price: 100 } }, "desk");
// => { price: 100 }

objectItem({ desk: { price: 100 } }, "desk.price");
// => throws InvalidArgumentException
```

#### boolean

Get a boolean item using "dot" notation, throwing an `InvalidArgumentException` if the value is not a boolean.

Exported as `boolean` from `@tolki/arr` and `@tolki/obj`, and as `dataBoolean` from `@tolki/data`.

Laravel: [`Arr::boolean()`](https://laravel.com/docs/helpers#method-array-boolean)

```js [@tolki/obj]
import { boolean } from "@tolki/obj";

boolean({ available: true }, "available");
// => true

boolean({ name: "Joe" }, "name");
// => throws InvalidArgumentException
```

#### chunk

Break an array or object into chunks of the given size.

Exported as `chunk` from `@tolki/arr` and `@tolki/obj`, and as `dataChunk` from `@tolki/data`.

```js [@tolki/obj]
import { chunk } from "@tolki/obj";

chunk({ a: 1, b: 2, c: 3 }, 2);
// => { 0: { a: 1, b: 2 }, 1: { c: 3 } }

// Pass false as the third argument to number the entries in each chunk instead of keeping their keys.
chunk({ a: 1, b: 2, c: 3 }, 2, false);
// => { 0: { 0: 1, 1: 2 }, 1: { 0: 3 } }
```

#### chunkBy

Break into chunks by comparing adjacent values, using a key path or a callback.

Exported as `chunkBy` from `@tolki/arr` and `@tolki/obj`, and as `dataChunkBy` from `@tolki/data`.

```js [@tolki/obj]
import { chunkBy } from "@tolki/obj";

chunkBy({ a: 1, b: 1, c: 2 }, (value) => value);
// => { 0: { a: 1, b: 1 }, 1: { c: 2 } }
```

#### chunkWhile

Break into chunks with a callback that decides whether the next value joins the current chunk. It receives the value, its key and the chunk built so far.

Exported as `chunkWhile` from `@tolki/arr` and `@tolki/obj`, and as `dataChunkWhile` from `@tolki/data`.

```js [@tolki/obj]
import { chunkWhile } from "@tolki/obj";

chunkWhile(
  { a: 1, b: 1, c: 2 },
  (value, key, chunk) => Object.values(chunk).at(-1) === value,
);
// => { 0: { a: 1, b: 1 }, 1: { c: 2 } }
```

#### collapse

Collapse an array of arrays into a single array, or an object of objects into a single object.

Exported as `collapse` from `@tolki/arr` and `@tolki/obj`, and as `dataCollapse` from `@tolki/data`.

Laravel: [`Arr::collapse()`](https://laravel.com/docs/helpers#method-array-collapse)

```js [@tolki/obj]
import { collapse } from "@tolki/obj";

collapse({ a: { x: 1 }, b: { y: 2 } });
// => { x: 1, y: 2 }
```

#### combine

Combine two sets: the values of the first become the keys and the values of the second become the values. Both must hold the same number of items.

Exported as `combine` from `@tolki/arr` and `@tolki/obj`, and as `dataCombine` from `@tolki/data`.

```js [@tolki/obj]
import { combine } from "@tolki/obj";

combine({ first: "name", second: "price" }, { x: "Desk", y: 100 });
// => { name: "Desk", price: 100 }
```

#### contains

Determine if there is a given value, a matching item or a matching key path. The comparison is loose, so `"1"` matches `1`; see [PHP Semantics](https://tolki.abe.dev/arrays-objects/php-semantics.html#loose-and-strict-comparison).

Exported as `contains` from `@tolki/arr` and `@tolki/obj`, and as `dataContains` from `@tolki/data`.

```js [@tolki/obj]
import { contains } from "@tolki/obj";

contains({ a: 1, b: 2 }, 2);
// => true

contains({ a: 1, b: 2 }, (value) => value > 2);
// => false

contains({ a: { age: 30 } }, "age", ">", 25);
// => true
```

#### containsStrict

Determine if there is a given value, compared strictly, so `"02"` does not match `2`.

Exported as `containsStrict` from `@tolki/arr` and `@tolki/obj`, and as `dataContainsStrict` from `@tolki/data`.

```js [@tolki/obj]
import { containsStrict } from "@tolki/obj";

containsStrict({ a: 1, b: "02" }, "02");
// => true

containsStrict({ a: 1, b: "02" }, 2);
// => false
```

#### crossJoin

Cross join the given sets, returning every possible combination.

Exported as `crossJoin` from `@tolki/arr` and `@tolki/obj`, and as `dataCrossJoin` from `@tolki/data`.

Laravel: [`Arr::crossJoin()`](https://laravel.com/docs/helpers#method-array-crossjoin)

```js [@tolki/obj]
import { crossJoin } from "@tolki/obj";

crossJoin({ size: ["S", "M"] }, { color: ["red", "blue"] });
// => [
//   { size: "S", color: "red" },
//   { size: "S", color: "blue" },
//   { size: "M", color: "red" },
//   { size: "M", color: "blue" },
// ]
```

#### diff

Get the items whose values are not present in the other set.

Exported as `diff` from `@tolki/arr` and `@tolki/obj`, and as `dataDiff` from `@tolki/data`.

```js [@tolki/obj]
import { diff } from "@tolki/obj";

diff({ a: 1, b: 2, c: 3 }, { x: 2 });
// => { a: 1, c: 3 }
```

#### diffAssoc

Get the items whose key and value are not both present in the other set.

Exported as `diffAssoc` from `@tolki/arr` and `@tolki/obj`, and as `dataDiffAssoc` from `@tolki/data`.

```js [@tolki/obj]
import { diffAssoc } from "@tolki/obj";

diffAssoc(
  { color: "orange", type: "fruit", remain: 6 },
  { color: "yellow", type: "fruit", remain: 3 },
);
// => { color: "orange", remain: 6 }
```

#### diffAssocUsing

Get the items whose key and value are not both present in the other set, using a callback to say whether two keys match.

Exported as `diffAssocUsing` from `@tolki/arr` and `@tolki/obj`, and as `dataDiffAssocUsing` from `@tolki/data`.

```js [@tolki/obj]
import { diffAssocUsing } from "@tolki/obj";

const same = (a, b) => a.toLowerCase() === b.toLowerCase();

diffAssocUsing({ a: "green", b: "brown" }, { A: "green", c: "blue" }, same);
// => { b: "brown" }
```

#### diffKeys

Get the items whose key is not present in the other set. Values are ignored.

Exported as `diffKeys` from `@tolki/arr` and `@tolki/obj`, and as `dataDiffKeys` from `@tolki/data`.

```js [@tolki/obj]
import { diffKeys } from "@tolki/obj";

diffKeys({ id: 1, first_word: "Hello" }, { id: 123, foo_bar: "Hello" });
// => { first_word: "Hello" }
```

#### diffKeysUsing

Get the items whose key is not present in the other set, using a callback to say whether two keys match. Values are ignored.

Exported as `diffKeysUsing` from `@tolki/arr` and `@tolki/obj`, and as `dataDiffKeysUsing` from `@tolki/data`.

```js [@tolki/obj]
import { diffKeysUsing } from "@tolki/obj";

const same = (a, b) => a.toLowerCase() === b.toLowerCase();

diffKeysUsing(
  { id: 1, first_word: "Hello" },
  { ID: 123, foo_bar: "Hello" },
  same,
);
// => { first_word: "Hello" }
```

#### diffUsing

Get the items whose values are not present in the other set, using a callback to say whether two values are equal.

Exported as `diffUsing` from `@tolki/arr` and `@tolki/obj`, and as `dataDiffUsing` from `@tolki/data`.

```js [@tolki/obj]
import { diffUsing } from "@tolki/obj";

const same = (a, b) => a.toLowerCase() === b.toLowerCase();

diffUsing({ a: "Green", b: "Brown" }, { x: "GREEN" }, same);
// => { b: "Brown" }
```

#### divide

Divide into two lists: one with the keys and the other with the values.

Exported as `divide` from `@tolki/arr` and `@tolki/obj`, and as `dataDivide` from `@tolki/data`.

Laravel: [`Arr::divide()`](https://laravel.com/docs/helpers#method-array-divide)

```js [@tolki/obj]
import { divide } from "@tolki/obj";

divide({ name: "Desk", price: 100 });
// => [["name", "price"], ["Desk", 100]]
```

#### dot

Flatten a multi-dimensional array or object into a single level that uses "dot" notation to show depth. See [Dot Notation](https://tolki.abe.dev/arrays-objects/dot-notation.html). The second argument is a key prefix, usually `""`. The third is a depth: how many levels to join into dotted keys. A depth of `0` or `null` joins none, as in Laravel. <!-- docs/php-parity/Arr/dot.json, "dot-depth-through-list", "dot-null-depth", "dot-zero-depth" --> A `Map` in the data is flattened in its key order. <!-- docs/php-parity/Arr/dot.json, "dot-nested-out-of-order" -->

Exported as `dot` from `@tolki/arr` and `@tolki/obj`, and as `dataDot` from `@tolki/data`.

Laravel: [`Arr::dot()`](https://laravel.com/docs/helpers#method-array-dot)

```js [@tolki/obj]
import { dot } from "@tolki/obj";

dot({
  m: new Map([
    [2, "c"],
    [0, "a"],
  ]),
});
// => { "m.2": "c", "m.0": "a" }

dot({ products: { desk: { price: 100 } } });
// => { "products.desk.price": 100 }

dot({ a: { b: { c: 1 } } }, "", 1);
// => { "a.b": { c: 1 } }

dot({ a: { b: 1 } }, "", null);
// => { a: { b: 1 } }
```

#### every

Determine if all items pass the given truth test.

Exported as `every` from `@tolki/arr` and `@tolki/obj`, and as `dataEvery` from `@tolki/data`.

Laravel: [`Arr::every()`](https://laravel.com/docs/helpers#method-array-every)

```js [@tolki/obj]
import { every } from "@tolki/obj";

every({ a: 1, b: 2 }, (value) => value > 0);
// => true

every({ a: 1, b: 2 }, (value) => value > 1);
// => false
```

#### except

Get all of the given array or object except for a specified list of keys.

Exported as `except` from `@tolki/arr` and `@tolki/obj`, and as `dataExcept` from `@tolki/data`.

Laravel: [`Arr::except()`](https://laravel.com/docs/helpers#method-array-except)

```js [@tolki/obj]
import { except } from "@tolki/obj";

except({ name: "Desk", price: 100, sku: "D-1" }, "price");
// => { name: "Desk", sku: "D-1" }

except({ name: "Desk", price: 100, sku: "D-1" }, ["price", "sku"]);
// => { name: "Desk" }

// A "dot" path reaches into a nested object.
except({ name: "Desk", price: { amount: 100, tax: 7 } }, "price.tax");
// => { name: "Desk", price: { amount: 100 } }
```

#### exceptValues

Get all of the given array or object except for a specified list of values. Values match loosely, unless `strict` is `true`.

Exported as `exceptValues` from `@tolki/arr` and `@tolki/obj`, and as `dataExceptValues` from `@tolki/data`.

Laravel: [`Arr::exceptValues()`](https://laravel.com/docs/helpers#method-array-except-values)

```js [@tolki/obj]
import { exceptValues } from "@tolki/obj";

exceptValues({ a: 1, b: 2, c: 1, d: 3 }, 1);
// => { b: 2, d: 3 }

exceptValues({ a: true, b: false, c: 1, d: 0 }, [1, 0], true);
// => { a: true, b: false }
```

#### exists

Determine if the given key exists in the provided array or object. A key set to `null` still exists.

Exported as `exists` from `@tolki/arr` and `@tolki/obj`, and as `dataExists` from `@tolki/data`.

Laravel: [`Arr::exists()`](https://laravel.com/docs/helpers#method-array-exists)

```js [@tolki/obj]
import { exists } from "@tolki/obj";

exists({ name: "Desk", price: null }, "price");
// => true

exists({ name: "Desk" }, "sku");
// => false
```

#### filter

Filter the array or object using a callback. Without a callback, it removes the items that PHP treats as empty. See [Truthiness](https://tolki.abe.dev/arrays-objects/php-semantics.html#truthiness).

Exported as `filter` from `@tolki/arr` and `@tolki/obj`, and as `dataFilter` from `@tolki/data`.

```js [@tolki/obj]
import { filter } from "@tolki/obj";

filter({ a: 1, b: 2, c: 3, d: 4 }, (value) => value > 2);
// => { c: 3, d: 4 }

filter({ a: "0", b: "", c: 0, d: "x" });
// => { d: "x" }
```

#### first

Get the first item, or the first item that passes a truth test. When nothing is found, it returns the default value, or `null`.

Exported as `first` from `@tolki/arr` and `@tolki/obj`, and as `dataFirst` from `@tolki/data`.

Laravel: [`Arr::first()`](https://laravel.com/docs/helpers#method-array-first)

```js [@tolki/obj]
import { first } from "@tolki/obj";

first({ a: 1, b: 2, c: 3 });
// => 1

first({ a: 1, b: 2, c: 3 }, (value) => value > 1);
// => 2

first({}, null, "none");
// => "none"
```

#### flatten

Flatten a multi-dimensional array or object into a single-level array of its values. The depth argument limits how many levels to flatten.

Exported as `flatten` from `@tolki/arr` and `@tolki/obj`, and as `dataFlatten` from `@tolki/data`.

Laravel: [`Arr::flatten()`](https://laravel.com/docs/helpers#method-array-flatten)

```js [@tolki/obj]
import { flatten } from "@tolki/obj";

flatten({ a: 1, b: { c: 2, d: { e: 3 } } });
// => [1, 2, 3]

flatten({ a: 1, b: { c: 2, d: { e: 3 } } }, 1);
// => [1, 2, { e: 3 }]
```

#### flattenDot

Flatten a multi-dimensional object into one level of "dot" notation keys, stopping at the given depth. See [Dot Notation](https://tolki.abe.dev/arrays-objects/dot-notation.html).

Exported as `flattenDot` from `@tolki/obj`.

```js [@tolki/obj]
import { flattenDot } from "@tolki/obj";

flattenDot({ users: { john: { name: "John", tags: ["a"] } } });
// => { "users.john.name": "John", "users.john.tags.0": "a" }

flattenDot({ users: { john: { name: "John" } } }, 1);
// => { "users.john": { name: "John" } }
```

<!-- docs/php-parity/Arr/dot.json, "dot-empty-leaf", "dot-nested-empty-leaf" -->

`flattenDot` drops an empty nested object or array, where Laravel's `Arr::dot()` keeps it as a value. Use [`dot`](#dot) to keep it. See [Behaviour differences](https://tolki.abe.dev/arrays-objects/differences.html#behaviour-differences).

#### flip

Flip the keys and the values: each value becomes a key, and each key becomes its value.

Exported as `flip` from `@tolki/arr` and `@tolki/obj`, and as `dataFlip` from `@tolki/data`.

```js [@tolki/obj]
import { flip } from "@tolki/obj";

flip({ name: "taylor", role: "admin" });
// => { taylor: "name", admin: "role" }
```

#### float

Get a float item using "dot" notation, throwing an `InvalidArgumentException` if the value is not a number.

Exported as `float` from `@tolki/arr` and `@tolki/obj`, and as `dataFloat` from `@tolki/data`.

Laravel: [`Arr::float()`](https://laravel.com/docs/helpers#method-array-float)

```js [@tolki/obj]
import { float } from "@tolki/obj";

float({ product: { price: 19.99 } }, "product.price");
// => 19.99

float({ product: { name: "Widget" } }, "product.name");
// => throws InvalidArgumentException
```

<!-- docs/php-parity/Arr/float.json, "Arr::float rejects a whole-number int" -->

`float` accepts a whole number such as `1`, where Laravel's `Arr::float()` throws, because PHP's `is_float()` rejects an integer. JavaScript has one number type. See [Behaviour differences](https://tolki.abe.dev/arrays-objects/differences.html#behaviour-differences).

#### forget

Remove one or many items from an array or object using "dot" notation. It returns a new value and leaves the original unchanged. See [Return values instead of references](https://tolki.abe.dev/arrays-objects/differences.html#return-values-instead-of-references).

Exported as `forget` from `@tolki/arr` and `@tolki/obj`, and as `dataForget` from `@tolki/data`.

Laravel: [`Arr::forget()`](https://laravel.com/docs/helpers#method-array-forget) · [`data_forget()`](https://laravel.com/docs/helpers#method-data-forget)

```js [@tolki/obj]
import { forget } from "@tolki/obj";

forget({ user: { name: "John", age: 30 } }, "user.age");
// => { user: { name: "John" } }

forget({ name: "John", age: 30, city: "NYC" }, ["age", "city"]);
// => { name: "John" }
```

#### from

Get the underlying array or object of items from the given argument: a list stays a list, and a `Map` becomes an object. A scalar throws an `InvalidArgumentException`.

Exported as `from` from `@tolki/arr` and `@tolki/obj`, and as `dataFrom` from `@tolki/data`.

Laravel: [`Arr::from()`](https://laravel.com/docs/helpers#method-array-from)

```js [@tolki/obj]
import { from } from "@tolki/obj";

from({ foo: "bar" });
// => { foo: "bar" }

from(new Map([["foo", "bar"]]));
// => { foo: "bar" }

from(1);
// => throws InvalidArgumentException
```

#### get

Get an item from an array or object using "dot" notation. A missing path returns the default value, or `null`. See [Dot Notation](https://tolki.abe.dev/arrays-objects/dot-notation.html).

Exported as `get` from `@tolki/arr` and `@tolki/obj`, and as `dataGet` from `@tolki/data`.

Laravel: [`Arr::get()`](https://laravel.com/docs/helpers#method-array-get) · [`data_get()`](https://laravel.com/docs/helpers#method-data-get)

```js [@tolki/obj]
import { get } from "@tolki/obj";

get({ desk: { price: 100 } }, "desk.price");
// => 100

get({ desk: { price: 100 } }, "desk.discount", 0);
// => 0
```

#### has

Determine if an item or items exist in an array or object using "dot" notation. A key set to `null` still exists. When given several keys, all of them must exist. See [Dot Notation](https://tolki.abe.dev/arrays-objects/dot-notation.html).

Exported as `has` from `@tolki/arr` and `@tolki/obj`, and as `dataHas` from `@tolki/data`.

Laravel: [`Arr::has()`](https://laravel.com/docs/helpers#method-array-has)

```js [@tolki/obj]
import { has } from "@tolki/obj";

has({ name: "John", address: { city: "NYC" } }, "address.city");
// => true

has({ name: "John", address: { city: "NYC" } }, ["name", "address.country"]);
// => false

has({ price: null }, "price");
// => true
```

#### hasAll

Determine if all keys exist in an array or object using "dot" notation. See [Dot Notation](https://tolki.abe.dev/arrays-objects/dot-notation.html).

Exported as `hasAll` from `@tolki/arr` and `@tolki/obj`, and as `dataHasAll` from `@tolki/data`.

Laravel: [`Arr::hasAll()`](https://laravel.com/docs/helpers#method-array-hasall)

```js [@tolki/obj]
import { hasAll } from "@tolki/obj";

hasAll({ name: "John", address: { city: "NYC" } }, ["name", "address.city"]);
// => true

hasAll({ name: "John", address: { city: "NYC" } }, ["name", "address.country"]);
// => false
```

#### hasAny

Determine if any of the keys exist in an array or object using "dot" notation. See [Dot Notation](https://tolki.abe.dev/arrays-objects/dot-notation.html).

Exported as `hasAny` from `@tolki/arr` and `@tolki/obj`, and as `dataHasAny` from `@tolki/data`.

Laravel: [`Arr::hasAny()`](https://laravel.com/docs/helpers#method-array-hasany)

```js [@tolki/obj]
import { hasAny } from "@tolki/obj";

hasAny({ name: "John", address: { city: "NYC" } }, ["email", "name"]);
// => true

hasAny({ name: "John", address: { city: "NYC" } }, ["email", "phone"]);
// => false
```

#### integer

Get an integer item using "dot" notation, throwing an `InvalidArgumentException` if the value is not an integer.

Exported as `integer` from `@tolki/arr` and `@tolki/obj`, and as `dataInteger` from `@tolki/data`.

Laravel: [`Arr::integer()`](https://laravel.com/docs/helpers#method-array-integer)

```js [@tolki/obj]
import { integer } from "@tolki/obj";

integer({ user: { age: 30 } }, "user.age");
// => 30

integer({ user: { name: "John" } }, "user.name");
// => throws InvalidArgumentException
```

#### intersect

Get the items whose values are also present in the other set. Values are compared as strings, so `2` matches `"2"`. The keys of the kept items stay with them in an object.

Exported as `intersect` from `@tolki/arr` and `@tolki/obj`, and as `dataIntersect` from `@tolki/data`.

```js [@tolki/obj]
import { intersect } from "@tolki/obj";

intersect({ a: "green", b: "brown", c: "blue" }, ["blue", "red", "green"]);
// => { a: "green", c: "blue" }
```

#### intersectAssoc

Get the items whose key and value are both present in the other set.

Exported as `intersectAssoc` from `@tolki/arr` and `@tolki/obj`, and as `dataIntersectAssoc` from `@tolki/data`.

```js [@tolki/obj]
import { intersectAssoc } from "@tolki/obj";

intersectAssoc(
  { a: "green", b: "brown", c: "blue", d: "red" },
  { a: "green", b: "yellow", c: "blue", d: "red" },
);
// => { a: "green", c: "blue", d: "red" }
```

#### intersectAssocUsing

Get the items whose key and value are both present in the other set, using a callback to say whether two keys match.

Exported as `intersectAssocUsing` from `@tolki/arr` and `@tolki/obj`, and as `dataIntersectAssocUsing` from `@tolki/data`.

```js [@tolki/obj]
import { intersectAssocUsing } from "@tolki/obj";

const same = (a, b) => a.toLowerCase() === b.toLowerCase();

intersectAssocUsing(
  { a: "green", b: "brown", c: "blue" },
  { A: "green", B: "yellow", c: "blue" },
  same,
);
// => { a: "green", c: "blue" }
```

#### intersectByKeys

Get the items whose key is present in the other set. Values are ignored.

Exported as `intersectByKeys` from `@tolki/arr` and `@tolki/obj`, and as `dataIntersectByKeys` from `@tolki/data`.

```js [@tolki/obj]
import { intersectByKeys } from "@tolki/obj";

intersectByKeys(
  { serial: "UX301", type: "screen", year: 2009 },
  { reference: "UX404", type: "tab", year: 2011 },
);
// => { type: "screen", year: 2009 }
```

#### intersectUsing

Get the items whose values are present in the other set, using a callback to say whether two values are equal.

Exported as `intersectUsing` from `@tolki/arr` and `@tolki/obj`, and as `dataIntersectUsing` from `@tolki/data`.

```js [@tolki/obj]
import { intersectUsing } from "@tolki/obj";

const same = (a, b) => a.toLowerCase() === b.toLowerCase();

intersectUsing({ a: "green", b: "brown" }, { A: "GREEN" }, same);
// => { a: "green" }
```

#### join

Join all items using a string. The final item can use a separate glue string.

Exported as `join` from `@tolki/arr` and `@tolki/obj`, and as `dataJoin` from `@tolki/data`.

Laravel: [`Arr::join()`](https://laravel.com/docs/helpers#method-array-join)

```js [@tolki/obj]
import { join } from "@tolki/obj";

join({ a: "Tailwind", b: "Alpine", c: "Laravel" }, ", ");
// => "Tailwind, Alpine, Laravel"

join({ a: "Tailwind", b: "Alpine", c: "Laravel" }, ", ", " and ");
// => "Tailwind, Alpine and Laravel"
```

#### keyBy

Key an array or object of rows by a field, or by the result of a callback.

Exported as `keyBy` from `@tolki/arr` and `@tolki/obj`, and as `dataKeyBy` from `@tolki/data`.

Laravel: [`Arr::keyBy()`](https://laravel.com/docs/helpers#method-array-keyby)

```js [@tolki/obj]
import { keyBy } from "@tolki/obj";

keyBy({ a: { id: 1, name: "Desk" }, b: { id: 2, name: "Chair" } }, "name");
// => { Desk: { id: 1, name: "Desk" }, Chair: { id: 2, name: "Chair" } }
```

#### keys

Get all of the keys of an array or object.

Exported as `keys` from `@tolki/arr` and `@tolki/obj`, and as `dataKeys` from `@tolki/data`.

```js [@tolki/obj]
import { keys } from "@tolki/obj";

keys({ name: "Desk", price: 100 });
// => ["name", "price"]

keys(
  new Map([
    [2, "c"],
    [0, "a"],
  ]),
);
// => [2, 0]
```

#### last

Get the last item, or the last item that passes a truth test. When nothing is found, it returns the default value, or `null`.

Exported as `last` from `@tolki/arr` and `@tolki/obj`, and as `dataLast` from `@tolki/data`.

Laravel: [`Arr::last()`](https://laravel.com/docs/helpers#method-array-last)

```js [@tolki/obj]
import { last } from "@tolki/obj";

last({ a: 1, b: 2, c: 3 });
// => 3

last({ a: 1, b: 2, c: 3 }, (value) => value < 3);
// => 2
```

#### map

Run a map over each of the items in an array or object. The callback gets the value, then the index or key.

Exported as `map` from `@tolki/arr` and `@tolki/obj`, and as `dataMap` from `@tolki/data`.

Laravel: [`Arr::map()`](https://laravel.com/docs/helpers#method-array-map)

```js [@tolki/obj]
import { map } from "@tolki/obj";

map({ a: 1, b: 2, c: 3 }, (value) => value * 2);
// => { a: 2, b: 4, c: 6 }

map({ a: 1, b: 2 }, (value, key) => `${key}=${value}`);
// => { a: "a=1", b: "b=2" }
```

#### mapSpread

Run a map over each row, spreading the row's items into the callback's arguments, followed by the index or key.

Exported as `mapSpread` from `@tolki/arr` and `@tolki/obj`, and as `dataMapSpread` from `@tolki/data`.

Laravel: [`Arr::mapSpread()`](https://laravel.com/docs/helpers#method-array-map-spread)

```js [@tolki/obj]
import { mapSpread } from "@tolki/obj";

mapSpread(
  {
    x: [1, "a"],
    y: [2, "b"],
  },
  (number, letter, key) => `${number}-${letter}-${key}`,
);
// => { x: "1-a-x", y: "2-b-y" }
```

#### mapWithKeys

Run an associative map over each of the items. The callback returns an object whose pairs become the entries of the result.

Exported as `mapWithKeys` from `@tolki/arr` and `@tolki/obj`, and as `dataMapWithKeys` from `@tolki/data`.

Laravel: [`Arr::mapWithKeys()`](https://laravel.com/docs/helpers#method-array-map-with-keys)

```js [@tolki/obj]
import { mapWithKeys } from "@tolki/obj";

mapWithKeys({ a: "x", b: "y" }, (value, key) => ({ [value]: key }));
// => { x: "a", y: "b" }
```

#### only

Get a subset of the items from the given array or object. The result keeps the order of the data, not the order of the keys.

Exported as `only` from `@tolki/arr` and `@tolki/obj`, and as `dataOnly` from `@tolki/data`.

Laravel: [`Arr::only()`](https://laravel.com/docs/helpers#method-array-only)

```js [@tolki/obj]
import { only } from "@tolki/obj";

only({ name: "Desk", price: 100, discount: false }, ["name", "price"]);
// => { name: "Desk", price: 100 }

only({ b: 1, a: 2 }, ["a", "b"]);
// => { b: 1, a: 2 }
```

#### onlyValues

Get a subset of the items from the given array or object by value. The comparison is loose, so `"1"` matches `1`; pass `true` as the third argument to compare strictly. See [PHP Semantics](https://tolki.abe.dev/arrays-objects/php-semantics.html#loose-and-strict-comparison).

Exported as `onlyValues` from `@tolki/arr` and `@tolki/obj`, and as `dataOnlyValues` from `@tolki/data`.

Laravel: [`Arr::onlyValues()`](https://laravel.com/docs/helpers#method-array-only-values)

<!-- docs/php-parity/Arr/onlyValues.json, "onlyValues-list-keeps-gap" -->

```js [@tolki/obj]
import { onlyValues } from "@tolki/obj";

onlyValues({ name: "taylor", age: 26, city: "austin" }, [26]);
// => { age: 26 }

onlyValues({ a: 1, b: 2, c: 1, d: 3 }, 1);
// => { a: 1, c: 1 }

onlyValues({ a: 1, b: "1", c: 2 }, [1], true);
// => { a: 1 }
```

#### pad

Pad an array or object to the specified length with a value. A positive size pads at the end, and a negative size pads at the start.

Exported as `pad` from `@tolki/arr` and `@tolki/obj`, and as `dataPad` from `@tolki/data`.

```js [@tolki/obj]
import { pad } from "@tolki/obj";

// The pad slots take the next integer keys, and JavaScript lists integer keys first.
pad({ a: 1, b: 2 }, 4, 0);
// => { 0: 0, 1: 0, a: 1, b: 2 }
```

#### partition

Partition an array or object into two using the given callback. The result is a pair: the items that pass, then the items that fail.

Exported as `partition` from `@tolki/arr` and `@tolki/obj`, and as `dataPartition` from `@tolki/data`.

Laravel: [`Arr::partition()`](https://laravel.com/docs/helpers#method-array-partition)

```js [@tolki/obj]
import { partition } from "@tolki/obj";

partition({ a: 1, b: 2, c: 3, d: 4 }, (value) => value > 2);
// => [{ c: 3, d: 4 }, { a: 1, b: 2 }]
```

#### pluck

Pluck an array of values from an array or object of rows. The path can be a dot path, and a `*` segment collects every item at that step; see [Wildcards](https://tolki.abe.dev/arrays-objects/dot-notation.html#wildcards).

Exported as `pluck` from `@tolki/arr` and `@tolki/obj`, and as `dataPluck` from `@tolki/data`.

Laravel: [`Arr::pluck()`](https://laravel.com/docs/helpers#method-array-pluck)

```js [@tolki/obj]
import { pluck } from "@tolki/obj";

const posts = {
  first: { title: "A", author: { name: "Ann" }, tags: [{ id: 1 }, { id: 2 }] },
  second: { title: "B", author: { name: "Bob" }, tags: [{ id: 3 }] },
};

pluck(posts, "author.name");
// => ["Ann", "Bob"]

pluck(posts, "tags.*.id", "title");
// => { A: [1, 2], B: [3] }
```

#### pop

Get and remove the last N items from an array or object. It changes the data you pass in, unlike most functions on this page. See [Return values instead of references](https://tolki.abe.dev/arrays-objects/differences.html#return-values-instead-of-references).

Exported as `pop` from `@tolki/arr` and `@tolki/obj`, and as `dataPop` from `@tolki/data`.

```js [@tolki/obj]
import { pop } from "@tolki/obj";

const stock = { a: 1, b: 2 };

pop(stock);
// => 2

stock;
// => { a: 1 }
```

#### prepend

Push an item onto the beginning of an array or object. It returns a new value and leaves the original unchanged.

Exported as `prepend` from `@tolki/arr` and `@tolki/obj`, and as `dataPrepend` from `@tolki/data`.

Laravel: [`Arr::prepend()`](https://laravel.com/docs/helpers#method-array-prepend)

```js [@tolki/obj]
import { prepend } from "@tolki/obj";

const sizes = { b: 2, c: 3 };

prepend(sizes, 1, "a");
// => { a: 1, b: 2, c: 3 }

sizes;
// => { b: 2, c: 3 }
```

#### prependKeysWith

Prepend the key names of an array or object with the given string.

Exported as `prependKeysWith` from `@tolki/arr` and `@tolki/obj`, and as `dataPrependKeysWith` from `@tolki/data`.

Laravel: [`Arr::prependKeysWith()`](https://laravel.com/docs/helpers#method-array-prependkeyswith)

```js [@tolki/obj]
import { prependKeysWith } from "@tolki/obj";

prependKeysWith({ a: 1, b: 2, c: 3 }, "item_");
// => { item_a: 1, item_b: 2, item_c: 3 }
```

#### pull

Get a value from an array or object, and remove it. It returns `{ value, data }`, where `data` is what is left, and it leaves the original unchanged. See [Return values instead of references](https://tolki.abe.dev/arrays-objects/differences.html#return-values-instead-of-references).

Exported as `pull` from `@tolki/arr` and `@tolki/obj`, and as `dataPull` from `@tolki/data`.

Laravel: [`Arr::pull()`](https://laravel.com/docs/helpers#method-array-pull)

```js [@tolki/obj]
import { pull } from "@tolki/obj";

const user = { user: { name: "John", age: 30 } };

pull(user, "user.name");
// => { value: "John", data: { user: { age: 30 } } }

user;
// => { user: { name: "John", age: 30 } }

pull({ a: 1 }, "x", "none");
// => { value: "none", data: { a: 1 } }
```

#### push

Push one or more items into the array at the given key, using "dot" notation. It returns a new value and leaves the original unchanged. See [Return values instead of references](https://tolki.abe.dev/arrays-objects/differences.html#return-values-instead-of-references). When the target is an object or a `Map`, the new item goes under the next whole-number key, as in Laravel. <!-- docs/php-parity/Arr/push.json, "push-assoc-leaf-appends", "push-out-of-order-leaf-appends-after-highest" -->

Exported as `push` from `@tolki/arr` and `@tolki/obj`, and as `dataPush` from `@tolki/data`.

Laravel: [`Arr::push()`](https://laravel.com/docs/helpers#method-array-push)

```js [@tolki/obj]
import { push } from "@tolki/obj";

const cart = { items: ["a", "b"] };

push(cart, "items", "c", "d");
// => { items: ["a", "b", "c", "d"] }

cart;
// => { items: ["a", "b"] }

push({}, "items", "a");
// => { items: ["a"] }

push({ tags: { a: "x" } }, "tags", "y");
// => { tags: { a: "x", 0: "y" } }

push({ a: 1 }, "a", 2);
// => throws InvalidArgumentException
```

#### query

Convert an array or object into a URL-encoded query string.

Exported as `query` from `@tolki/arr` and `@tolki/obj`, and as `dataQuery` from `@tolki/data`.

Laravel: [`Arr::query()`](https://laravel.com/docs/helpers#method-array-query)

```js [@tolki/obj]
import { query } from "@tolki/obj";

query({ name: "John", age: 30 });
// => "name=John&age=30"

query({ user: { name: "John" }, tags: ["php", "js"] });
// => "user%5Bname%5D=John&tags%5B0%5D=php&tags%5B1%5D=js"

query({ q: "a b&c", on: true, off: false, none: null });
// => "q=a%20b%26c&on=1&off=0"
```

#### random

Get one or a specified number of random values from an array or object. The picked items come back in the order they have in the data.

Exported as `random` from `@tolki/arr` and `@tolki/obj`, and as `dataRandom` from `@tolki/data`.

Laravel: [`Arr::random()`](https://laravel.com/docs/helpers#method-array-random)

```js [@tolki/obj]
import { random } from "@tolki/obj";

random({ a: 1, b: 2, c: 3 }, 2);
// e.g. { 0: 1, 1: 3 }

Object.keys(random({ a: 1, b: 2, c: 3 }, 2));
// => ["0", "1"]

// Pass true as the third argument to keep the original keys.
Object.keys(random({ a: 1, b: 2, c: 3 }, 2, true)).length;
// => 2
```

#### reject

Filter an array or object using the negation of the given callback: the items that fail the test stay.

Exported as `reject` from `@tolki/arr` and `@tolki/obj`, and as `dataReject` from `@tolki/data`.

Laravel: [`Arr::reject()`](https://laravel.com/docs/helpers#method-array-reject)

```js [@tolki/obj]
import { reject } from "@tolki/obj";

reject({ a: 1, b: 2, c: 3, d: 4 }, (value) => value > 2);
// => { a: 1, b: 2 }
```

#### replace

Replace the items of an array or object with the given replacer items. It returns a new value. Only the top level is replaced; see `replaceRecursive` for nested values.

Exported as `replace` from `@tolki/arr` and `@tolki/obj`, and as `dataReplace` from `@tolki/data`.

```js [@tolki/obj]
import { replace } from "@tolki/obj";

replace({ a: 1, b: 2 }, { b: 3, c: 4 });
// => { a: 1, b: 3, c: 4 }

replace({ a: { x: 1, y: 2 } }, { a: { x: 9 } });
// => { a: { x: 9 } }
```

#### replaceRecursive

Recursively replace the items of an array or object with the given items. Two nested arrays or objects merge, and any other value is replaced. It returns a new value.

Exported as `replaceRecursive` from `@tolki/arr` and `@tolki/obj`, and as `dataReplaceRecursive` from `@tolki/data`.

```js [@tolki/obj]
import { replaceRecursive } from "@tolki/obj";

replaceRecursive(
  { user: { name: "John", age: 30 }, tags: ["a", "b"] },
  { user: { age: 31 }, tags: ["z"] },
);
// => { user: { name: "John", age: 31 }, tags: ["z", "b"] }
```

#### reverse

Reverse the order of an array or object and return the result.

Exported as `reverse` from `@tolki/arr` and `@tolki/obj`, and as `dataReverse` from `@tolki/data`.

```js [@tolki/obj]
import { reverse } from "@tolki/obj";

reverse({ a: 1, b: 2, c: 3 });
// => { c: 3, b: 2, a: 1 }
```

#### select

Select an array or object of values from each item in an array or object. Each key is an exact name, not a dot path.

Exported as `select` from `@tolki/arr` and `@tolki/obj`, and as `dataSelect` from `@tolki/data`.

Laravel: [`Arr::select()`](https://laravel.com/docs/helpers#method-array-select)

```js [@tolki/obj]
import { select } from "@tolki/obj";

select(
  {
    desk: { name: "Desk", price: 100 },
    chair: { name: "Chair", price: 50 },
  },
  ["name"],
);
// => { desk: { name: "Desk" }, chair: { name: "Chair" } }
```

#### set

Set an array or object item to a given value using "dot" notation. It returns a new value and leaves the original unchanged. See [Return values instead of references](https://tolki.abe.dev/arrays-objects/differences.html#return-values-instead-of-references).

Exported as `set` from `@tolki/arr` and `@tolki/obj`, and as `dataSet` from `@tolki/data`.

Laravel: [`Arr::set()`](https://laravel.com/docs/helpers#method-array-set) · [`data_set()`](https://laravel.com/docs/helpers#method-data-set)

```js [@tolki/obj]
import { set } from "@tolki/obj";

const user = { user: { name: "John" } };

set(user, "user.age", 30);
// => { user: { name: "John", age: 30 } }

user;
// => { user: { name: "John" } }

set({}, "products.desk.price", 200);
// => { products: { desk: { price: 200 } } }
```

#### shift

Get and remove the first N items from an array or object. It changes the data you pass in, unlike most functions on this page. See [Return values instead of references](https://tolki.abe.dev/arrays-objects/differences.html#return-values-instead-of-references).

Exported as `shift` from `@tolki/arr` and `@tolki/obj`, and as `dataShift` from `@tolki/data`.

```js [@tolki/obj]
import { shift } from "@tolki/obj";

const stock = { a: 1, b: 2, c: 3 };

shift(stock);
// => 1

stock;
// => { b: 2, c: 3 }
```

#### shuffle

Shuffle an array or object and return the result. The result is a new value; an object comes back as a list-like object whose keys are `0` to `n - 1`.

Exported as `shuffle` from `@tolki/arr` and `@tolki/obj`, and as `dataShuffle` from `@tolki/data`.

Laravel: [`Arr::shuffle()`](https://laravel.com/docs/helpers#method-array-shuffle)

```js [@tolki/obj]
import { shuffle } from "@tolki/obj";

shuffle({ a: 1, b: 2, c: 3 });
// e.g. { 0: 3, 1: 1, 2: 2 }

Object.keys(shuffle({ a: 1, b: 2, c: 3 }));
// => ["0", "1", "2"]
```

#### skipUntil

Skip items in an array or object until the given condition is met, and return the rest. The condition is a value, matched strictly, so `"2"` does not match `2`, or a callback.

Exported as `skipUntil` from `@tolki/arr` and `@tolki/obj`, and as `dataSkipUntil` from `@tolki/data`.

```js [@tolki/obj]
import { skipUntil } from "@tolki/obj";

skipUntil({ a: 1, b: 2, c: 3 }, 2);
// => { b: 2, c: 3 }

skipUntil({ a: 1, b: 2, c: 3 }, (value, key) => key === "b");
// => { b: 2, c: 3 }
```

#### skipWhile

Skip items in an array or object while the given condition is met, and return the rest. The condition is a value, matched strictly, or a callback.

Exported as `skipWhile` from `@tolki/arr` and `@tolki/obj`, and as `dataSkipWhile` from `@tolki/data`.

```js [@tolki/obj]
import { skipWhile } from "@tolki/obj";

skipWhile({ a: 1, b: 1, c: 2, d: 1 }, 1);
// => { c: 2, d: 1 }

skipWhile({ a: 1, b: 2, c: 3 }, (value, key) => key === "a");
// => { b: 2, c: 3 }
```

#### slice

Get a portion of an array or object, starting at an offset. The original is left unchanged; `splice` is the function that removes items.

Exported as `slice` from `@tolki/arr` and `@tolki/obj`, and as `dataSlice` from `@tolki/data`.

```js [@tolki/obj]
import { slice } from "@tolki/obj";

slice({ a: 1, b: 2, c: 3, d: 4 }, 1, 2);
// => { b: 2, c: 3 }

slice({ a: 1, b: 2, c: 3, d: 4 }, -2);
// => { c: 3, d: 4 }
```

#### sole

Get the first item, but only if exactly one item exists. Otherwise it throws `ItemNotFoundException` when none is found, or `MultipleItemsFoundException` when several are. With a callback, it counts only the items the callback accepts.

Exported as `sole` from `@tolki/arr` and `@tolki/obj`, and as `dataSole` from `@tolki/data`.

Laravel: [`Arr::sole()`](https://laravel.com/docs/helpers#method-array-sole)

```js [@tolki/obj]
import { sole } from "@tolki/obj";

sole({ a: 1 });
// => 1

sole({ a: 1, b: 2 }, (value) => value > 1);
// => 2

sole({});
// => throws ItemNotFoundException

sole({ a: 1, b: 2 });
// => throws MultipleItemsFoundException
```

#### some

Determine if some items pass the given truth test.

Exported as `some` from `@tolki/arr` and `@tolki/obj`, and as `dataSome` from `@tolki/data`.

Laravel: [`Arr::some()`](https://laravel.com/docs/helpers#method-array-some)

```js [@tolki/obj]
import { some } from "@tolki/obj";

some({ a: 1, b: 2 }, (value, key) => key === "b");
// => true

some({ a: 1, b: 2 }, (value) => value > 2);
// => false
```

#### sort

Sort an array or object by its values, by a callback, by a "dot" path, or by a list of sort descriptors. It returns a new value and leaves the original unchanged.

Exported as `sort` from `@tolki/arr` and `@tolki/obj`, and as `dataSort` from `@tolki/data`.

Laravel: [`Arr::sort()`](https://laravel.com/docs/helpers#method-array-sort)

```js [@tolki/obj]
import { sort } from "@tolki/obj";

// Each key stays with its value.
sort({ a: 3, b: 1, c: 2 });
// => { b: 1, c: 2, a: 3 }

sort({ x: { n: 2 }, y: { n: 1 } }, "n");
// => { y: { n: 1 }, x: { n: 2 } }
```

#### sortDesc

Sort an array or object in descending order. It takes the same callbacks, paths and descriptors as `sort`, and returns a new value.

Exported as `sortDesc` from `@tolki/arr` and `@tolki/obj`, and as `dataSortDesc` from `@tolki/data`.

Laravel: [`Arr::sortDesc()`](https://laravel.com/docs/helpers#method-array-sort-desc)

```js [@tolki/obj]
import { sortDesc } from "@tolki/obj";

// Each key stays with its value.
sortDesc({ a: 3, b: 1, c: 2 });
// => { a: 3, c: 2, b: 1 }
```

#### sortRecursive

Recursively sort an array or object by its keys and values. Nested lists sort by value and nested objects sort by key.

Exported as `sortRecursive` from `@tolki/arr` and `@tolki/obj`, and as `dataSortRecursive` from `@tolki/data`.

Laravel: [`Arr::sortRecursive()`](https://laravel.com/docs/helpers#method-array-sort-recursive)

```js [@tolki/obj]
import { sortRecursive } from "@tolki/obj";

sortRecursive({ b: [3, 1, 2], a: { d: 2, c: 1 } });
// => { a: { c: 1, d: 2 }, b: [1, 2, 3] }
```

#### sortRecursiveDesc

Recursively sort an array or object by its keys and values in descending order.

Exported as `sortRecursiveDesc` from `@tolki/arr` and `@tolki/obj`, and as `dataSortRecursiveDesc` from `@tolki/data`.

```js [@tolki/obj]
import { sortRecursiveDesc } from "@tolki/obj";

sortRecursiveDesc({ a: [1, 2, 3], b: { c: 1, d: 2 } });
// => { b: { d: 2, c: 1 }, a: [3, 2, 1] }
```

#### splice

Remove a portion of an array or object, optionally put replacements in its place, and return what was removed. It changes the data you pass in, unlike most functions on this page. See [Return values instead of references](https://tolki.abe.dev/arrays-objects/differences.html#return-values-instead-of-references).

Exported as `splice` from `@tolki/arr` and `@tolki/obj`, and as `dataSplice` from `@tolki/data`.

```js [@tolki/obj]
import { splice } from "@tolki/obj";

const stock = { a: 1, b: 2, c: 3, d: 4 };

splice(stock, 1, 2);
// => { b: 2, c: 3 }

stock;
// => { a: 1, d: 4 }
```

#### string

Get a string item using "dot" notation, throwing an `InvalidArgumentException` if the value is not a string.

Exported as `string` from `@tolki/arr` and `@tolki/obj`, and as `dataString` from `@tolki/data`.

Laravel: [`Arr::string()`](https://laravel.com/docs/helpers#method-array-string)

```js [@tolki/obj]
import { string } from "@tolki/obj";

string({ name: "John" }, "name");
// => "John"

string({ name: 123 }, "name");
// => throws InvalidArgumentException
```

#### take

Take the first or last N items of an array or object. A negative number takes from the end.

Exported as `take` from `@tolki/arr` and `@tolki/obj`, and as `dataTake` from `@tolki/data`.

Laravel: [`Arr::take()`](https://laravel.com/docs/helpers#method-array-take)

```js [@tolki/obj]
import { take } from "@tolki/obj";

take({ a: 1, b: 2, c: 3 }, 2);
// => { a: 1, b: 2 }

take({ a: 1, b: 2, c: 3 }, -2);
// => { b: 2, c: 3 }
```

#### takeUntil

Take items from an array or object until the given condition is met. The condition is a value, matched strictly, or a callback.

Exported as `takeUntil` from `@tolki/arr` and `@tolki/obj`, and as `dataTakeUntil` from `@tolki/data`.

```js [@tolki/obj]
import { takeUntil } from "@tolki/obj";

takeUntil({ a: 1, b: 2, c: 3 }, 3);
// => { a: 1, b: 2 }

takeUntil({ a: 1, b: 2, c: 3 }, (value, key) => key === "c");
// => { a: 1, b: 2 }
```

#### takeWhile

Take items from an array or object while the given condition is met. The condition is a value, matched strictly, or a callback.

Exported as `takeWhile` from `@tolki/arr` and `@tolki/obj`, and as `dataTakeWhile` from `@tolki/data`.

```js [@tolki/obj]
import { takeWhile } from "@tolki/obj";

takeWhile({ a: 1, b: 1, c: 2 }, 1);
// => { a: 1, b: 1 }

takeWhile({ a: 1, b: 2, c: 3 }, (value) => value < 3);
// => { a: 1, b: 2 }
```

#### toCssClasses

Conditionally compile CSS classes into a class list. A plain entry is always kept. A `class: condition` entry is kept when its condition is true.

Exported as `toCssClasses` from `@tolki/arr` and `@tolki/obj`, and as `dataToCssClasses` from `@tolki/data`.

Laravel: [`Arr::toCssClasses()`](https://laravel.com/docs/helpers#method-array-to-css-classes)

```js [@tolki/obj]
import { toCssClasses } from "@tolki/obj";

toCssClasses({ "p-4": true, "font-bold": true, "bg-red": false });
// => "p-4 font-bold"

toCssClasses({ 0: "font-bold", 1: "mt-4", "ml-2": true, "mr-2": false });
// => "font-bold mt-4 ml-2"
```

#### toCssStyles

Conditionally compile CSS styles into a style list. Each style ends with a semicolon, and the styles are separated by a space.

Exported as `toCssStyles` from `@tolki/arr` and `@tolki/obj`, and as `dataToCssStyles` from `@tolki/data`.

Laravel: [`Arr::toCssStyles()`](https://laravel.com/docs/helpers#method-array-to-css-styles)

```js [@tolki/obj]
import { toCssStyles } from "@tolki/obj";

toCssStyles({
  "font-weight: bold": true,
  "margin-left: 2px": true,
  "margin-right: 2px": false,
});
// => "font-weight: bold; margin-left: 2px;"
```

#### undot

Expand a flat object with "dot" keys into a nested array or object.

Exported as `undot` from `@tolki/arr` and `@tolki/obj`, and as `dataUndot` from `@tolki/data`.

Laravel: [`Arr::undot()`](https://laravel.com/docs/helpers#method-array-undot)

```js [@tolki/obj]
import { undot } from "@tolki/obj";

undot({ "user.name": "John", "user.age": 30 });
// => { user: { name: "John", age: 30 } }

undot({ "products.desk.price": 100, "products.desk.name": "Desk" });
// => { products: { desk: { price: 100, name: "Desk" } } }
```

#### union

Union arrays or objects into one. An earlier argument wins: a later one only adds the keys the result does not have yet.

Exported as `union` from `@tolki/arr` and `@tolki/obj`, and as `dataUnion` from `@tolki/data`.

```js [@tolki/obj]
import { union } from "@tolki/obj";

union({ a: 1, b: 2 }, { b: 3, c: 4 });
// => { a: 1, b: 2, c: 4 }

union({ a: 1 }, { a: 2, b: 2 }, { c: 3 });
// => { a: 1, b: 2, c: 3 }
```

#### unshift

Prepend one or more items to the start of an array or object. It changes the data you pass in, unlike most functions on this page. See [Return values instead of references](https://tolki.abe.dev/arrays-objects/differences.html#return-values-instead-of-references).

Exported as `unshift` from `@tolki/arr` and `@tolki/obj`, and as `dataUnshift` from `@tolki/data`.

```js [@tolki/obj]
import { unshift } from "@tolki/obj";

const stock = { b: 2 };

// Each new item goes under the next whole-number key.
unshift(stock, "x");
// => { 0: "x", b: 2 }

stock;
// => { 0: "x", b: 2 }
```

#### values

Get all the values of an array or object as a list.

Exported as `values` from `@tolki/arr` and `@tolki/obj`, and as `dataValues` from `@tolki/data`.

```js [@tolki/obj]
import { values } from "@tolki/obj";

values({ a: 1, b: 2 });
// => [1, 2]
```

#### where

Filter an array or object using the given callback. A list comes back renumbered from 0; see [Behaviour differences](https://tolki.abe.dev/arrays-objects/differences.html#behaviour-differences).

Exported as `where` from `@tolki/arr` and `@tolki/obj`, and as `dataWhere` from `@tolki/data`.

Laravel: [`Arr::where()`](https://laravel.com/docs/helpers#method-array-where)

```js [@tolki/obj]
import { where } from "@tolki/obj";

where({ a: 1, b: 2, c: 3 }, (value) => value > 1);
// => { b: 2, c: 3 }

where({ a: 1, b: 2, c: 3 }, (value, key) => key !== "b");
// => { a: 1, c: 3 }
```

#### whereNotNull

Filter an array or object, removing the items whose value is `null`. Only `null` is removed; an `undefined` item stays. A list comes back renumbered from 0; see [Behaviour differences](https://tolki.abe.dev/arrays-objects/differences.html#behaviour-differences).

Exported as `whereNotNull` from `@tolki/arr` and `@tolki/obj`, and as `dataWhereNotNull` from `@tolki/data`.

Laravel: [`Arr::whereNotNull()`](https://laravel.com/docs/helpers#method-array-where-not-null)

```js [@tolki/obj]
import { whereNotNull } from "@tolki/obj";

whereNotNull({ a: 1, b: null, c: 3 });
// => { a: 1, c: 3 }

"d" in whereNotNull({ a: 1, d: undefined });
// => true
```

#### wrap

If the given value is not already an array (an object, with `@tolki/obj`), wrap it in one. `null` gives an empty result.

Exported as `wrap` from `@tolki/arr` and `@tolki/obj`. `@tolki/data` has no `wrap`.

Laravel: [`Arr::wrap()`](https://laravel.com/docs/helpers#method-array-wrap)

```js [@tolki/obj]
import { wrap } from "@tolki/obj";

// A value that is not an object goes under the key 0.
wrap("hello");
// => { 0: "hello" }

wrap({ hello: "world" });
// => { hello: "world" }

wrap(null);
// => {}
```

## Dot Notation

A dot path is a string such as `"user.address.city"` that reaches into nested arrays and objects in one call. `@tolki/arr`, `@tolki/obj`, `@tolki/data` and the `Collection` methods all read the same paths.

### Path syntax

Each segment between the dots is an object key or an array index. A number segment picks that position of an array. A path that leads nowhere gives the default, which is `null` when you leave it out.

```js [@tolki/obj]
import { get } from "@tolki/obj";

get({ desk: { sizes: ["s", "m"] } }, "desk.sizes.1");
// => "m"

get({ desk: { sizes: ["s", "m"] } }, "desk.color", "none");
// => "none"
```

### Keys that contain a dot

An object key can hold a dot of its own. `get` from `@tolki/obj` tries the whole string as a key first, and only splits it into segments when no such key exists.

<!-- docs/php-parity/Arr/get.json, "X26 get/has/exists resolve a literal dotted key first" -->

Laravel's `Arr::get()` does the same, so the port gives the same answer.

```js
import { get } from "@tolki/obj";

get({ "a.b": 1, a: { b: 2 } }, "a.b");
// => 1

get({ a: { b: 2 } }, "a.b");
// => 2
```

`dataGet` from `@tolki/data` also tries the literal key first, because it forwards to `get`. Laravel's `data_get()` does not: it always splits the path, so `data_get(['a.b' => 1, 'a' => ['b' => 2]], 'a.b')` is `2`. <!-- docs/php-parity/Helpers/data_get.json, "C32-D-data-get-literal-dotted-key" -->

```js
import { dataGet } from "@tolki/data";

dataGet({ "a.b": 1, a: { b: 2 } }, "a.b");
// => 1
```

### Functions that take a path

- **Read:** `get`, `has`, `hasAll`, `hasAny`, and the typed getters `string`, `integer`, `float`, `boolean` and `arrayItem` (`objectItem`, `dataItem`).
- **Write:** `set`, `add`, `forget`, `pull` and `push`. `set`, `add` and `push` create the missing steps of a path as they go. `forget` leaves the data as it is when the path is missing, and `pull` returns the default, `null` unless you pass one, with the data unchanged.
- **Pick out of rows:** `pluck` takes a path for the value and for the key, and `except` takes paths among its keys.
- **Walk:** a path goes into lists, plain objects and `Map`s. A write keeps a `Map` a `Map`. <!-- docs/php-parity/Arr/get.json, "get-nested-out-of-order-keys"; docs/php-parity/Arr/set.json, "set-nested-append-keeps-key-order" -->
- **Convert:** `dot` turns a nested structure into a flat object of paths, and `undot` turns it back.

```js [@tolki/obj]
import {
  add,
  dot,
  except,
  forget,
  has,
  get,
  integer,
  pull,
  push,
  set,
  undot,
} from "@tolki/obj";

has({ a: { b: 1 } }, "a.z");
// => false

set({}, "a.b.c", 1);
// => { a: { b: { c: 1 } } }

except({ a: { b: 1, c: 2 }, d: 3 }, ["a.b"]);
// => { a: { c: 2 }, d: 3 }

integer({ a: { b: 2 } }, "a.b");
// => 2

get(
  {
    m: new Map([
      [2, "c"],
      [0, "a"],
    ]),
  },
  "m.0",
);
// => "a"

dot({ a: { b: 1, c: [2] } });
// => { "a.b": 1, "a.c.0": 2 }

undot({ "a.b": 1, "a.c": 2 });
// => { a: { b: 1, c: 2 } }

add({}, "a.b", 1);
// => { a: { b: 1 } }

push({}, "a.b", 1);
// => { a: { b: [1] } }

forget({ a: 1 }, "b.c");
// => { a: 1 }

pull({ a: 1 }, "b.c");
// => { value: null, data: { a: 1 } }
```

### Wildcards

A `*` segment stands for every item at that step, and `pluck` collects what lies behind it. The result has one entry per item in front of the `*`.

<!-- docs/php-parity/Arr/pluck.json, "Arr::pluck wildcard path", "Arr::pluck wildcard + key" -->

Laravel's `Arr::pluck()` reads a `*` the same way, and the port returns the same shape.

```js [@tolki/obj]
import { pluck } from "@tolki/obj";

const posts = {
  a: { title: "A", tags: [{ id: 1 }, { id: 2 }] },
  b: { title: "B", tags: [{ id: 3 }] },
};

pluck(posts, "tags.*.id");
// => [[1, 2], [3]]

pluck(posts, "tags.*.id", "title");
// => { A: [1, 2], B: [3] }
```

### Where wildcards do not work

Of the functions above, only `pluck` reads a `*`. `get`, `has` and their `data` versions take it as the name of a key, so a path with `*` finds nothing. The same goes for the `{first}` and `{last}` segments.

<!-- docs/php-parity/Helpers/data_get.json, "data-get-wildcard-and-first-last-segments" -->

Laravel's `data_get()` expands both of them. See [Differences from Laravel](https://tolki.abe.dev/arrays-objects/differences.html#behaviour-differences) for the full list.

```js [@tolki/obj]
import { get, has } from "@tolki/obj";

get({ a: { n: 1 }, b: { n: 2 } }, "*.n");
// => null

has({ a: { n: 1 } }, "*.n");
// => false

get({ s: [{ x: 1 }, { x: 2 }] }, "s.{first}.x");
// => null
```

### Collections read the same paths

`@tolki/collection` methods that look inside items, such as `pluck`, `where`, `sortBy`, `keyBy` and `sum`, take the same paths, and `pluck` takes the same `*`. `get` is the exception: it takes one key, not a path. The method pages are in the Collections section, under [Methods List](https://tolki.abe.dev/collections/methods-list.html#pluck).

```js
import { collect } from "@tolki/collection";

const posts = collect([
  { title: "A", author: { id: 2 }, tags: [{ id: 1 }, { id: 2 }] },
  { title: "B", author: { id: 1 }, tags: [{ id: 3 }] },
]);

posts.pluck("tags.*.id").all();
// => [[1, 2], [3]]

posts.where("author.id", 1).pluck("title").all();
// => ["B"]

posts.sortBy("author.id").pluck("title").all();
// => ["B", "A"]

posts.sum("author.id");
// => 3

collect({ a: { b: 1 } }).get("a.b");
// => null
```

## PHP Semantics

These packages port Laravel, so where JavaScript and PHP disagree about what is equal, what is true or what a key is, the port follows PHP. That keeps a result the same as the one Laravel gives. This page lists the four places it matters. The helpers behind them live in `@tolki/utils`.

### Loose and strict comparison

PHP's `==` is loose: it converts a value before it compares. A string that reads as a number equals that number, and `null` equals `0`, `""` and `[]`. The functions that compare values (`contains`, `search`, `unique`, `where` and others) use it, and the ones with a `Strict` twin (`containsStrict`, `whereStrict`) use PHP's `===` instead.

<!-- docs/php-parity/Php/loose-equal.json, "one and its numeric string", "null and zero", "null and empty string", "null and an empty array", "null and undefined-as-null", "zero and a letter", "one and zero-padded one" -->

`looseEqual` from `@tolki/utils` is the `==` operator. `"1" == 1` and `null == 0` are both true in PHP. PHP has no `undefined`, so the port reads it as `null`. `"abc"` does not equal `0`, but `"1"` equals `"01"`. JavaScript's own `==` gives a different answer for `null == 0` (false) and for `"1" == "01"` (false).

```js
import { looseEqual } from "@tolki/utils";

looseEqual("1", 1);
// => true

looseEqual(null, 0);
// => true

looseEqual(null, undefined);
// => true

looseEqual("abc", 0);
// => false

looseEqual("1", "01");
// => true
```

The `contains` and `containsStrict` pair shows the difference on a list.

```js [@tolki/obj]
import { contains, containsStrict } from "@tolki/obj";

contains({ a: "1" }, 1);
// => true

containsStrict({ a: "1" }, 1);
// => false
```

On a `Collection`, `where` is loose and `whereStrict` is strict, and `where` with a `==` or `===` operator picks the same two.

```js
import { collect } from "@tolki/collection";

const rows = collect([{ a: 1 }, { a: "1" }, { a: 2 }]);

rows.where("a", 1).all();
// => [{ a: 1 }, { a: "1" }]

rows.whereStrict("a", 1).all();
// => [{ a: 1 }]

rows.where("a", "===", 1).all();
// => [{ a: 1 }]
```

### Truthiness

Wherever a callback or a value is tested for being true, PHP's rule applies, not JavaScript's. The tests are `filter()` with no callback, `Collection`'s `reject()` with no argument, `Collection`'s `where` without an operator, and what a callback to `first`, `where`, `reject`, `every`, `some` or `sole` answers.

<!-- docs/php-parity/Php/truthiness.json, "truthiness-the-string-zero", "truthiness-the-string-0.0", "truthiness-an-empty-string", "truthiness-integer-zero", "truthiness-null", "truthiness-an-empty-array", "truthiness-an-array-holding-zero", "truthiness-NAN", "truthiness-an-empty-object" -->

In PHP the string `"0"`, the empty string, `0`, `null`, `false` and the empty array are false. The string `"0.0"`, `NaN` and a non-empty array are true. The port keeps the same list and adds the JavaScript containers that have no PHP twin: an empty plain object, an empty `Map` and an empty `Set` are false. Any other object is true, however empty.

```js
import { collect } from "@tolki/collection";
import { isFalsy, isPhpFalsy } from "@tolki/utils";

collect(["0", "0.0", "", 0, [], {}, NaN, "a", false, null]).filter().all();
// => ["0.0", NaN, "a"]

collect([1, null, 0, 2]).reject().all();
// => [null, 0]

collect([{ a: 1 }, { a: 0 }])
  .where("a")
  .all();
// => [{ a: 1 }]

isPhpFalsy("0");
// => true

isFalsy("0");
// => false

isPhpFalsy(new Map());
// => true

isPhpFalsy(NaN);
// => false
```

`isFalsy` is the JavaScript-minded check, where `"0"` is true. Use `isPhpFalsy` when you want the rule the packages use.

A callback that answers `"0"` counts as false, and one that answers `"0.0"` counts as true.

<!-- docs/php-parity/Arr/callback-truthiness.json, "C32-C-arr-callback-php-truthiness" -->

```js [@tolki/obj]
import { where } from "@tolki/obj";

where({ x: "a", y: "b" }, () => "0");
// => {}

where({ x: "a", y: "b" }, () => "0.0");
// => { x: "a", y: "b" }
```

### Key casting

PHP stores a string key that reads as a plain integer, such as `"10"`, as the number `10`. A string such as `"01"` stays a string. The port does the same, so a callback gets a number for `"10"` and a string for `"01"`, and `keys` lists them that way.

<!-- docs/php-parity/Collection/callback-key-types.json, "C32-E-callback-key-types-sweep" -->
<!-- docs/php-parity/Arr/set.json, "set-record-key-cast" -->

A callback sees the number `1` for the key `"1"` and a string for `"x"`, and `set` writes the key `"1"` as an integer but `"01"` as a string.

```js [@tolki/obj]
import { keys } from "@tolki/obj";

keys({ 10: "a", "01": "b", x: "c" });
// => [10, "01", "x"]
```

```js
import { map, set } from "@tolki/obj";

map({ 10: 1, "01": 2, x: 3 }, (value, key) => typeof key);
// => { 10: "number", "01": "string", x: "string" }

set({ x: 1 }, "1", "V");
// => { 1: "V", x: 1 }

set({ x: 1 }, "01", "V");
// => { x: 1, "01": "V" }
```

`phpArrayKey` from `@tolki/utils` applies the rule to one key. Two keys that cast to the same key are one key, so the later value wins, as in a PHP array literal.

<!-- docs/php-parity/Arr/first.json, "first-collision" -->

```js
import { values } from "@tolki/obj";
import { phpArrayKey } from "@tolki/utils";

phpArrayKey("10");
// => 10

phpArrayKey("-5");
// => -5

phpArrayKey("01");
// => "01"

values(
  new Map([
    [1, "a"],
    ["1", "b"],
  ]),
);
// => ["b"]
```

### Exceptions

The errors Laravel throws exist here under the same names. `@tolki/utils` exports them, and each one extends `Error`, so `instanceof` tells them apart.

<!-- docs/php-parity/Arr/integer.json, "integer-string-value" -->
<!-- docs/php-parity/Arr/sole.json, "sole-none", "sole-multi-list" -->
<!-- docs/php-parity/Collection/ensure.json, "C32-A-ensure-scalar-message" -->
<!-- docs/php-parity/Collection/callback-truthiness.json, "C32-C-collection-callback-php-truthiness" -->

| Class                         | Thrown when                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------- |
| `InvalidArgumentException`    | A typed getter (`string`, `integer`, `float`, `boolean`) finds another type. |
| `ItemNotFoundException`       | `sole` or `firstOrFail` finds no match.                                      |
| `MultipleItemsFoundException` | `sole` finds more than one match. It carries the number found as `count`.    |
| `UnexpectedValueException`    | `Collection.ensure` meets an item of a type you did not allow.               |

```js
import { sole } from "@tolki/arr";
import { integer } from "@tolki/obj";
import {
  InvalidArgumentException,
  ItemNotFoundException,
  MultipleItemsFoundException,
} from "@tolki/utils";

sole([1, 2], () => true);
// => throws MultipleItemsFoundException

integer({ a: "x" }, "a");
// => throws InvalidArgumentException

let caught;

try {
  sole([]);
} catch (error) {
  caught = error instanceof ItemNotFoundException;
}

caught;
// => true

try {
  sole([1, 2], () => true);
} catch (error) {
  caught = error instanceof MultipleItemsFoundException && error.count;
}

caught;
// => 2

try {
  integer({ a: "x" }, "a");
} catch (error) {
  caught = error instanceof InvalidArgumentException;
}

caught;
// => true
```

## Differences from Laravel

`@tolki/arr`, `@tolki/obj` and `@tolki/data` follow Laravel's `Arr` class and `data_*` helpers wherever JavaScript can hold the same data. This page lists the places where they cannot, or choose not to. For the rules they keep on purpose, see [PHP Semantics](https://tolki.abe.dev/arrays-objects/php-semantics.html).

### Return values instead of references

<!-- docs/php-parity/Arr/set.json, "set-dot-path-under-a-list-index" -->
<!-- docs/php-parity/Arr/forget.json, "forget-products.desk.price" -->
<!-- docs/php-parity/Arr/push.json, "push-mutates-the-caller-by-reference" -->
<!-- docs/php-parity/Arr/pull.json, "Arr::pull — first-level key containing dots" -->

Laravel's `Arr::set()`, `forget()`, `push()` and `pull()` take the array by reference and change it. JavaScript cannot pass a variable that way, so these functions return the result and leave what you passed in unchanged. Assign the result to keep it.

- `set` returns the array or object with the value written. <!-- docs/php-parity/Arr/set.json, "set-dot-path-under-a-list-index" -->
- `forget` returns it with the path removed. <!-- docs/php-parity/Arr/forget.json, "forget-products.desk.price" -->
- `push` returns it with the values appended to the array at the path. <!-- docs/php-parity/Arr/push.json, "push-mutates-the-caller-by-reference" -->
- `pull` returns `{ value, data }`: the item taken out, and the data without it. <!-- docs/php-parity/Arr/pull.json, "Arr::pull — first-level key containing dots" -->

```js [@tolki/obj]
import { forget, pull, push, set } from "@tolki/obj";

const desk = { price: { amount: 100, tax: 7 }, tags: ["a"] };

set(desk, "price.amount", 200);
// => { price: { amount: 200, tax: 7 }, tags: ["a"] }

forget(desk, "price.tax");
// => { price: { amount: 100 }, tags: ["a"] }

push(desk, "tags", "b");
// => { price: { amount: 100, tax: 7 }, tags: ["a", "b"] }

pull(desk, "price.tax");
// => { value: 7, data: { price: { amount: 100 }, tags: ["a"] } }

desk;
// => { price: { amount: 100, tax: 7 }, tags: ["a"] }
```

`shift`, `pop`, `splice` and `unshift` are different. Laravel gets them from `Collection`, which changes itself, and the functions keep that: they change the array or object you pass and return what came out (or the changed value, for `unshift`).

<!-- docs/php-parity/Collection/shift.json, "X2 shift mutates and returns the first value" -->
<!-- docs/php-parity/Collection/pop.json, "X1 pop mutates and returns the last value" -->
<!-- docs/php-parity/Collection/splice.json, "X6 splice mutates and returns the removed items" -->
<!-- docs/php-parity/Collection/unshift.json, "X5 unshift mutates and renumbers integer keys" -->

```js [@tolki/obj]
import { pop, shift } from "@tolki/obj";

const stock = { a: 1, b: 2, c: 3 };

shift(stock);
// => 1

pop(stock);
// => 3

stock;
// => { b: 2 }
```

### Behaviour differences

- `float` accepts a whole number such as `1`, where Laravel's `Arr::float()` throws, because PHP's `is_float()` rejects an integer. JavaScript has one number type. <!-- docs/php-parity/Arr/float.json, "Arr::float rejects a whole-number int" -->
- `get`, `has` and the other path readers take `*`, `{first}` and `{last}` as plain key names, where Laravel's `data_get()` expands them. `pluck` does read a `*`. <!-- docs/php-parity/Helpers/data_get.json, "data-get-wildcard-and-first-last-segments" -->
- On a list, `where`, `reject` and `whereNotNull` return the kept values as a new array numbered from 0, where Laravel keeps each value's original key. An object keeps its keys. <!-- docs/php-parity/Arr/where.json, "where-preserves-int-keys"; docs/php-parity/Arr/reject.json, "reject-preserves-int-keys"; docs/php-parity/Arr/whereNotNull.json, "whereNotNull-list-preserves-keys" -->
- The functions Laravel takes from `Collection` give the same list result: `filter`, `intersectAssoc`, `intersectByKeys`, `diffKeys`, `reverse`, `skipUntil` and `skipWhile` return a list numbered from 0 where Laravel keeps each value's original key. `chunk`, `chunkBy` and `chunkWhile` renumber the values inside each chunk, where Laravel keeps their keys. `diff`, `diffAssoc`, `intersect` and `slice` return a fresh list in the same way. `@tolki/obj` keeps the keys of an object. <!-- docs/php-parity/Collection/filter.json, "filter-list-gap-keys"; docs/php-parity/Collection/intersectAssoc.json, "intersectAssoc-list-keeps-gap-keys"; docs/php-parity/Collection/intersectByKeys.json, "intersectByKeys-list-keeps-gap-keys"; docs/php-parity/Collection/diffKeys.json, "C32-F-diffKeys-signature-examples"; docs/php-parity/Collection/reverse.json, "reverse preserves keys and reverses entry order"; docs/php-parity/Collection/skipUntil.json, "C32-D-skipUntil-list-keys"; docs/php-parity/Collection/skipWhile.json, "C32-D-skipWhile-list-keys"; docs/php-parity/Collection/chunk.json, "collection-chunk-last-chunk-keys"; docs/php-parity/Collection/chunkBy.json, "chunkBy with a callback"; docs/php-parity/Collection/chunkWhile.json, "chunkWhile on equal adjacent elements"; docs/php-parity/Collection/diff.json, "diff on array-backed collection"; docs/php-parity/Collection/diffAssoc.json, "diffAssoc on array-backed collection"; docs/php-parity/Collection/intersect.json, "intersect on array-backed collection"; docs/php-parity/Collection/slice.json, "X15 slice with a negative offset and a length" -->
- `dataGet` reads a literal key that contains a dot before it splits the path, so `dataGet({ "a.b": 1, a: { b: 2 } }, "a.b")` is `1`, where Laravel's `data_get()` is `2`. When the literal key is the only one, `dataGet` still finds it and `data_get()` returns the default. `get` in `@tolki/obj` does the same. <!-- docs/php-parity/Helpers/data_get.json, "C32-D-data-get-literal-dotted-key" -->
- A plain object lists integer-like keys first, in ascending order, whatever order you wrote them. Laravel's arrays keep insertion order. A `Map` keeps insertion order, so pass one when the order matters. <!-- docs/php-parity/Arr/divide.json, "divide-mixed" -->
- With a final glue and a single item, `join` returns that item cast to a string, where Laravel returns the item as it is: `1` stays the number `1`. <!-- docs/php-parity/Arr/join.json, "C32-H-arr-join-pieces" -->

```js
import { chunk, filter, float, intersectAssoc, join, where } from "@tolki/arr";
import { dataGet } from "@tolki/data";
import { divide, filter as filterObject, get, reject } from "@tolki/obj";

float([{ price: 1 }], "0.price");
// => 1

get({ a: { n: 1 }, b: { n: 2 } }, "*.n");
// => null

where(
  ["100", "200", "300", "400"],
  (value) => value === "200" || value === "400",
);
// => ["200", "400"]

reject({ a: 1, b: 2, c: 3 }, (value) => value > 1);
// => { a: 1 }

filter([1, 2, 3], (value) => value !== 2);
// => [1, 3]

filterObject({ 0: 1, 1: 2, 2: 3 }, (value) => value !== 2);
// => { 0: 1, 2: 3 }

intersectAssoc(["a", "b", "c"], ["a", "x", "c"]);
// => ["a", "c"]

chunk([1, 2, 3, 4, 5], 2);
// => [[1, 2], [3, 4], [5]]

dataGet({ "a.b": 1, a: { b: 2 } }, "a.b");
// => 1

dataGet({ "a.b": 1 }, "a.b", "miss");
// => 1

get({ "a.b": 1, a: { b: 2 } }, "a.b");
// => 1

divide({ x: 1, 0: 2 });
// => [[0, "x"], [2, 1]]

divide(
  new Map([
    ["x", 1],
    [0, 2],
  ]),
);
// => [["x", 0], [1, 2]]

join([1], ", ", " and ");
// => "1"
```

### Not ported

These Laravel helpers have no function in the packages.

- `Arr::isAssoc()` and `Arr::isList()`: in none of the three. `Array.isArray()` tells a list from an object.
- `data_fill()`, and the global `head()` and `last()` helpers. `first` and `last` from the packages are `Arr::first()` and `Arr::last()`.
- `accessible`, `arrayable` and `wrap` in `@tolki/data`. `@tolki/arr` and `@tolki/obj` have them.

```js
import * as arr from "@tolki/arr";
import * as data from "@tolki/data";
import * as obj from "@tolki/obj";

"isList" in arr || "isAssoc" in obj || "dataFill" in data;
// => false

"dataAccessible" in data || "dataArrayable" in data || "dataWrap" in data;
// => false
```

### Renamed

- `Arr::array()` is `arrayItem` in `@tolki/arr`, `objectItem` in `@tolki/obj` and `dataItem` in `@tolki/data`. `array` is too generic a name to export.
- `Arr::arrayable()` is `arrayable` in `@tolki/arr` and `objectifiable` in `@tolki/obj`.
- `data_get()`, `data_set()` and `data_forget()` are `dataGet`, `dataSet` and `dataForget`. Every other function in `@tolki/data` takes the same `data` prefix, so `Arr::pluck()` is `dataPluck`.

```js [@tolki/obj]
import { objectItem } from "@tolki/obj";

objectItem({ desk: { price: 100 } }, "desk");
// => { price: 100 }
```

### JavaScript-only additions

- Functions Laravel has on `Collection` rather than on `Arr`. All three packages export `chunk`, `chunkBy`, `chunkWhile`, `combine`, `contains`, `containsStrict`, the `diff` and `intersect` families, `filter`, `flip`, `keys`, `pad`, `pop`, `replace`, `replaceRecursive`, `reverse`, `shift`, `skipUntil`, `skipWhile`, `slice`, `splice`, `takeUntil`, `takeWhile`, `union`, `unshift` and `values`. `@tolki/data` also has `dataCount`, `dataSearch`, `dataBefore` and `dataAfter`. <!-- docs/php-parity/Collection/search.json, "search-callback"; docs/php-parity/Collection/before.json, "before-array-needle"; docs/php-parity/Collection/after.json, "after-array-needle"; docs/php-parity/Collection/count.json, "count-empty" -->
- `flattenDot` in `@tolki/obj` flattens like `dot` but drops an empty nested object or array, where `dot` keeps it as a value, as Laravel's `Arr::dot()` does. <!-- docs/php-parity/Arr/dot.json, "dot-empty-leaf", "dot-nested-empty-leaf" -->
- `dataUndot(data, true)` builds a list from paths made of whole numbers such as `"0.1"`, as `undot` from `@tolki/arr` always does. It throws a `TypeError` for any other path.
- Every function that takes a dot path reads and writes a `Map` at any depth as Laravel reads a nested array, and `dot` and `flattenDot` walk one the same way. A write keeps the `Map` a `Map` and keeps its key order. Helpers that recurse through values, such as `flatten`, `sortRecursive` and `replaceRecursive`, do not walk into a nested `Map`. When the whole data is a `Map`, a path function that writes, such as `set`, `forget` or `push`, returns a plain object. <!-- docs/php-parity/Arr/set.json, "set-nested-append-keeps-key-order" -->
- `@tolki/data` reads a `Set` and a generator as a list.

```js
import {
  dataAfter,
  dataBefore,
  dataCount,
  dataFrom,
  dataGet,
  dataSearch,
  dataUndot,
} from "@tolki/data";
import { dot, flatten, flattenDot, set } from "@tolki/obj";

dataCount({ a: 1, b: 2 });
// => 2

dataSearch([1, 2, 3], 2);
// => 1

dataBefore([1, 2, 3], 3);
// => 2

dataAfter([1, 2, 3], 1);
// => 2

dot({ a: {}, b: { c: 1 } });
// => { a: {}, "b.c": 1 }

flattenDot({ a: {}, b: { c: 1 } });
// => { "b.c": 1 }

dataUndot({ "0.0": "x", 0.1: "y" }, true);
// => [["x", "y"]]

dataFrom(new Set([1, 2]));
// => [1, 2]

dataGet(new Map([["a", { b: 1 }]]), "a.b");
// => 1

set(
  {
    m: new Map([
      [2, "c"],
      [0, "a"],
    ]),
  },
  "m.1",
  "b",
);
// => { m: new Map([[2, "c"], [0, "a"], [1, "b"]]) }

flatten({ m: new Map([["a", 1]]) });
// => [new Map([["a", 1]])]
```

<!-- AUTO-GENERATED-DOCS:END -->
