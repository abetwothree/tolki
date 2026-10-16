<p align="center"><img src="https://raw.githubusercontent.com/abetwothree/tolki/refs/heads/master/docs/vitepress/public/tolki-logo-short.svg" width="50%" alt="Laravel Tolki JS Logo"></p>

# Tolki JS Data Package

This package provides utilities for working with JavaScript objects and arrays in one package.

## Documentation

The full documentation for the data utilities can be found at [https://tolki.abe.dev](https://tolki.abe.dev/arrays-objects/).

<!-- AUTO-GENERATED-DOCS:START -->

## Array & Object Utilities Installation

Three packages cover Laravel's `Arr` class and `data_*` helpers: [`@tolki/arr`](https://www.npmjs.com/package/@tolki/arr) for arrays, [`@tolki/obj`](https://www.npmjs.com/package/@tolki/obj) for plain objects, and [`@tolki/data`](https://www.npmjs.com/package/@tolki/data), which picks between the two at runtime. You can install any of them via npm, yarn, or pnpm:

```bash [@tolki/data]
# npm
npm install @tolki/data

# pnpm
pnpm add @tolki/data

# yarn
yarn add @tolki/data
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

```js [@tolki/data]
import { dataGet } from "@tolki/data";

dataGet([{ price: 100 }], "0.price");
// => 100

dataGet({ desk: { price: 100 } }, "desk.price");
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

[add](#add) [after](#after) [arrayItem](#arrayitem) [before](#before) [boolean](#boolean) [chunk](#chunk) [chunkBy](#chunkby) [chunkWhile](#chunkwhile) [collapse](#collapse) [combine](#combine) [contains](#contains) [containsStrict](#containsstrict) [count](#count) [crossJoin](#crossjoin) [diff](#diff) [diffAssoc](#diffassoc) [diffAssocUsing](#diffassocusing) [diffKeys](#diffkeys) [diffKeysUsing](#diffkeysusing) [diffUsing](#diffusing) [divide](#divide) [dot](#dot) [every](#every) [except](#except) [exceptValues](#exceptvalues) [exists](#exists) [filter](#filter) [first](#first) [flatten](#flatten) [flip](#flip) [float](#float) [forget](#forget) [from](#from) [get](#get) [has](#has) [hasAll](#hasall) [hasAny](#hasany) [integer](#integer) [intersect](#intersect) [intersectAssoc](#intersectassoc) [intersectAssocUsing](#intersectassocusing) [intersectByKeys](#intersectbykeys) [intersectUsing](#intersectusing) [join](#join) [keyBy](#keyby) [keys](#keys) [last](#last) [map](#map) [mapSpread](#mapspread) [mapWithKeys](#mapwithkeys) [only](#only) [onlyValues](#onlyvalues) [pad](#pad) [partition](#partition) [pluck](#pluck) [pop](#pop) [prepend](#prepend) [prependKeysWith](#prependkeyswith) [pull](#pull) [push](#push) [query](#query) [random](#random) [reject](#reject) [replace](#replace) [replaceRecursive](#replacerecursive) [reverse](#reverse) [search](#search) [select](#select) [set](#set) [shift](#shift) [shuffle](#shuffle) [skipUntil](#skipuntil) [skipWhile](#skipwhile) [slice](#slice) [sole](#sole) [some](#some) [sort](#sort) [sortDesc](#sortdesc) [sortRecursive](#sortrecursive) [sortRecursiveDesc](#sortrecursivedesc) [splice](#splice) [string](#string) [take](#take) [takeUntil](#takeuntil) [takeWhile](#takewhile) [toCssClasses](#tocssclasses) [toCssStyles](#tocssstyles) [undot](#undot) [union](#union) [unshift](#unshift) [values](#values) [where](#where) [whereNotNull](#wherenotnull)

### Utilities Details

#### add

Add an element using "dot" notation if it doesn't exist. A key that is missing or set to `null` counts as not existing.

Exported as `add` from `@tolki/arr` and `@tolki/obj`, and as `dataAdd` from `@tolki/data`.

Laravel: [`Arr::add()`](https://laravel.com/docs/helpers#method-array-add)

```js [@tolki/data]
import { dataAdd } from "@tolki/data";

dataAdd([1, 2], 2, 3);
// => [1, 2, 3]

dataAdd({ name: "Desk" }, "price", 100);
// => { name: "Desk", price: 100 }

dataAdd({ name: "Desk", price: 100 }, "price", 200);
// => { name: "Desk", price: 100 }

dataAdd({}, "product.price", 100);
// => { product: { price: 100 } }
```

#### after

Get the item after a specified value, or `null` when the value is the last one or is not found.

Exported as `dataAfter` from `@tolki/data`.

```js [@tolki/data]
import { dataAfter } from "@tolki/data";

dataAfter([1, 2, 3], 2);
// => 3

dataAfter({ a: 1, b: 2, c: 3 }, 2);
// => 3

dataAfter([1, 2, 3], 3);
// => null
```

#### arrayItem

Get an item using "dot" notation, throwing an `InvalidArgumentException` unless it is a list (`@tolki/arr`) or a plain object (`@tolki/obj`). `dataItem` expects the kind that matches its first argument.

Exported as `arrayItem` from `@tolki/arr`, as `objectItem` from `@tolki/obj` and as `dataItem` from `@tolki/data`.

Laravel: [`Arr::array()`](https://laravel.com/docs/helpers#method-array-array)

```js [@tolki/data]
import { dataItem } from "@tolki/data";

dataItem([{ tags: ["a", "b"] }], "0.tags");
// => ["a", "b"]

dataItem({ desk: { price: 100 } }, "desk");
// => { price: 100 }

dataItem({ desk: { price: 100 } }, "desk.price");
// => throws InvalidArgumentException
```

#### before

Get the item before a specified value, or `null` when the value is the first one or is not found.

Exported as `dataBefore` from `@tolki/data`.

```js [@tolki/data]
import { dataBefore } from "@tolki/data";

dataBefore([1, 2, 3], 2);
// => 1

dataBefore({ a: 1, b: 2, c: 3 }, 2);
// => 1

dataBefore([1, 2, 3], 1);
// => null
```

#### boolean

Get a boolean item using "dot" notation, throwing an `InvalidArgumentException` if the value is not a boolean.

Exported as `boolean` from `@tolki/arr` and `@tolki/obj`, and as `dataBoolean` from `@tolki/data`.

Laravel: [`Arr::boolean()`](https://laravel.com/docs/helpers#method-array-boolean)

```js [@tolki/data]
import { dataBoolean } from "@tolki/data";

dataBoolean({ available: true }, "available");
// => true

dataBoolean([true, false], 1);
// => false

dataBoolean({ available: true }, "missing", false);
// => false

dataBoolean({ name: "Joe" }, "name");
// => throws InvalidArgumentException
```

#### chunk

Break an array or object into chunks of the given size.

Exported as `chunk` from `@tolki/arr` and `@tolki/obj`, and as `dataChunk` from `@tolki/data`.

```js [@tolki/data]
import { dataChunk } from "@tolki/data";

dataChunk([1, 2, 3, 4, 5], 2);
// => [[1, 2], [3, 4], [5]]

dataChunk({ a: 1, b: 2, c: 3 }, 2);
// => { 0: { a: 1, b: 2 }, 1: { c: 3 } }
```

#### chunkBy

Break into chunks by comparing adjacent values, using a key path or a callback.

Exported as `chunkBy` from `@tolki/arr` and `@tolki/obj`, and as `dataChunkBy` from `@tolki/data`.

```js [@tolki/data]
import { dataChunkBy } from "@tolki/data";

dataChunkBy([1, 1, 2], (value) => value);
// => [[1, 1], [2]]

dataChunkBy({ a: 1, b: 1, c: 2 }, (value) => value);
// => { 0: { a: 1, b: 1 }, 1: { c: 2 } }
```

#### chunkWhile

Break into chunks with a callback that decides whether the next value joins the current chunk. It receives the value, its key and the chunk built so far.

Exported as `chunkWhile` from `@tolki/arr` and `@tolki/obj`, and as `dataChunkWhile` from `@tolki/data`.

```js [@tolki/data]
import { dataChunkWhile } from "@tolki/data";

dataChunkWhile([1, 1, 2], (value, index, chunk) => chunk.at(-1) === value);
// => [[1, 1], [2]]
```

#### collapse

Collapse an array of arrays into a single array, or an object of objects into a single object.

Exported as `collapse` from `@tolki/arr` and `@tolki/obj`, and as `dataCollapse` from `@tolki/data`.

Laravel: [`Arr::collapse()`](https://laravel.com/docs/helpers#method-array-collapse)

```js [@tolki/data]
import { dataCollapse } from "@tolki/data";

dataCollapse([[1, 2], [3]]);
// => [1, 2, 3]

dataCollapse({ a: { x: 1 }, b: { y: 2 } });
// => { x: 1, y: 2 }
```

#### combine

Combine two sets: the values of the first become the keys and the values of the second become the values. Both must hold the same number of items.

Exported as `combine` from `@tolki/arr` and `@tolki/obj`, and as `dataCombine` from `@tolki/data`.

```js [@tolki/data]
import { dataCombine } from "@tolki/data";

dataCombine(["name", "price"], ["Desk", 100]);
// => { name: "Desk", price: 100 }
```

#### contains

Determine if there is a given value, a matching item or a matching key path. The comparison is loose, so `"1"` matches `1`; see [PHP Semantics](https://tolki.abe.dev/arrays-objects/php-semantics.html#loose-and-strict-comparison).

Exported as `contains` from `@tolki/arr` and `@tolki/obj`, and as `dataContains` from `@tolki/data`.

```js [@tolki/data]
import { dataContains } from "@tolki/data";

dataContains([1, 2, 3], 2);
// => true

dataContains({ a: 1, b: 2 }, (value) => value > 1);
// => true
```

#### containsStrict

Determine if there is a given value, compared strictly, so `"02"` does not match `2`.

Exported as `containsStrict` from `@tolki/arr` and `@tolki/obj`, and as `dataContainsStrict` from `@tolki/data`.

```js [@tolki/data]
import { dataContainsStrict } from "@tolki/data";

dataContainsStrict([1, 3, 5, "02"], 2);
// => false

dataContainsStrict([{ user: { id: 2 } }], "user.id", 2);
// => true
```

#### count

Count the number of items in an array, an object or a `Map`.

Exported as `dataCount` from `@tolki/data`.

```js [@tolki/data]
import { dataCount } from "@tolki/data";

dataCount([1, 2, 3]);
// => 3

dataCount({ a: 1, b: 2 });
// => 2
```

#### crossJoin

Cross join the given sets, returning every possible combination.

Exported as `crossJoin` from `@tolki/arr` and `@tolki/obj`, and as `dataCrossJoin` from `@tolki/data`.

Laravel: [`Arr::crossJoin()`](https://laravel.com/docs/helpers#method-array-crossjoin)

```js [@tolki/data]
import { dataCrossJoin } from "@tolki/data";

dataCrossJoin([1, 2], ["a", "b"]);
// => [[1, "a"], [1, "b"], [2, "a"], [2, "b"]]
```

#### diff

Get the items whose values are not present in the other set.

Exported as `diff` from `@tolki/arr` and `@tolki/obj`, and as `dataDiff` from `@tolki/data`.

```js [@tolki/data]
import { dataDiff } from "@tolki/data";

dataDiff([1, 2, 3, 4], [2, 4]);
// => [1, 3]

dataDiff({ a: 1, b: 2, c: 3 }, { x: 2 });
// => { a: 1, c: 3 }
```

#### diffAssoc

Get the items whose key and value are not both present in the other set.

Exported as `diffAssoc` from `@tolki/arr` and `@tolki/obj`, and as `dataDiffAssoc` from `@tolki/data`.

```js [@tolki/data]
import { dataDiffAssoc } from "@tolki/data";

dataDiffAssoc({ a: 1, b: 2, c: 3 }, { b: 2 });
// => { a: 1, c: 3 }
```

#### diffAssocUsing

Get the items whose key and value are not both present in the other set, using a callback to say whether two keys match.

Exported as `diffAssocUsing` from `@tolki/arr` and `@tolki/obj`, and as `dataDiffAssocUsing` from `@tolki/data`.

```js [@tolki/data]
import { dataDiffAssocUsing } from "@tolki/data";

const same = (a, b) => a.toLowerCase() === b.toLowerCase();

dataDiffAssocUsing({ a: "green", b: "brown" }, { A: "green", c: "blue" }, same);
// => { b: "brown" }
```

#### diffKeys

Get the items whose key is not present in the other set. Values are ignored.

Exported as `diffKeys` from `@tolki/arr` and `@tolki/obj`, and as `dataDiffKeys` from `@tolki/data`.

```js [@tolki/data]
import { dataDiffKeys } from "@tolki/data";

dataDiffKeys([1, 2, 3], [9, 9]);
// => [3]

dataDiffKeys({ id: 1, first_word: "Hello" }, { id: 123, foo_bar: "Hello" });
// => { first_word: "Hello" }
```

#### diffKeysUsing

Get the items whose key is not present in the other set, using a callback to say whether two keys match. Values are ignored.

Exported as `diffKeysUsing` from `@tolki/arr` and `@tolki/obj`, and as `dataDiffKeysUsing` from `@tolki/data`.

```js [@tolki/data]
import { dataDiffKeysUsing } from "@tolki/data";

const same = (a, b) => a.toLowerCase() === b.toLowerCase();

dataDiffKeysUsing(
  { id: 1, first_word: "Hello" },
  { ID: 123, foo_bar: "Hello" },
  same,
);
// => { first_word: "Hello" }
```

#### diffUsing

Get the items whose values are not present in the other set, using a callback to say whether two values are equal.

Exported as `diffUsing` from `@tolki/arr` and `@tolki/obj`, and as `dataDiffUsing` from `@tolki/data`.

```js [@tolki/data]
import { dataDiffUsing } from "@tolki/data";

const same = (a, b) => a.toLowerCase() === b.toLowerCase();

dataDiffUsing(["Green", "Brown", "Blue"], ["GREEN", "Yellow"], same);
// => ["Brown", "Blue"]
```

#### divide

Divide into two lists: one with the keys and the other with the values.

Exported as `divide` from `@tolki/arr` and `@tolki/obj`, and as `dataDivide` from `@tolki/data`.

Laravel: [`Arr::divide()`](https://laravel.com/docs/helpers#method-array-divide)

```js [@tolki/data]
import { dataDivide } from "@tolki/data";

dataDivide(["Desk", 100]);
// => [[0, 1], ["Desk", 100]]

dataDivide({ name: "Desk", price: 100 });
// => [["name", "price"], ["Desk", 100]]
```

#### dot

Flatten a multi-dimensional array or object into a single level that uses "dot" notation to show depth. See [Dot Notation](https://tolki.abe.dev/arrays-objects/dot-notation.html). The second argument is a key prefix, usually `""`. The third is a depth: how many levels to join into dotted keys. A depth of `0` or `null` joins none, as in Laravel. <!-- docs/php-parity/Arr/dot.json, "dot-depth-through-list", "dot-null-depth", "dot-zero-depth" -->

Exported as `dot` from `@tolki/arr` and `@tolki/obj`, and as `dataDot` from `@tolki/data`.

Laravel: [`Arr::dot()`](https://laravel.com/docs/helpers#method-array-dot)

```js [@tolki/data]
import { dataDot } from "@tolki/data";

dataDot({ products: { desk: { price: 100 } } });
// => { "products.desk.price": 100 }

dataDot(["a", ["b", "c"]]);
// => { 0: "a", "1.0": "b", "1.1": "c" }
```

#### every

Determine if all items pass the given truth test.

Exported as `every` from `@tolki/arr` and `@tolki/obj`, and as `dataEvery` from `@tolki/data`.

Laravel: [`Arr::every()`](https://laravel.com/docs/helpers#method-array-every)

```js [@tolki/data]
import { dataEvery } from "@tolki/data";

dataEvery([1, 2, 3], (value) => value > 0);
// => true

dataEvery({ a: 1, b: 2 }, (value) => value > 1);
// => false
```

#### except

Get all of the given array or object except for a specified list of keys.

Exported as `except` from `@tolki/arr` and `@tolki/obj`, and as `dataExcept` from `@tolki/data`.

Laravel: [`Arr::except()`](https://laravel.com/docs/helpers#method-array-except)

```js [@tolki/data]
import { dataExcept } from "@tolki/data";

dataExcept(["a", "b", "c"], 1);
// => ["a", "c"]

dataExcept({ name: "Desk", price: 100 }, "price");
// => { name: "Desk" }
```

#### exceptValues

Get all of the given array or object except for a specified list of values. Values match loosely, unless `strict` is `true`.

Exported as `exceptValues` from `@tolki/arr` and `@tolki/obj`, and as `dataExceptValues` from `@tolki/data`.

Laravel: [`Arr::exceptValues()`](https://laravel.com/docs/helpers#method-array-except-values)

```js [@tolki/data]
import { dataExceptValues } from "@tolki/data";

dataExceptValues([1, 2, 3, 2], 2);
// => [1, 3]

dataExceptValues({ a: 1, b: 2, c: 1 }, 1);
// => { b: 2 }
```

#### exists

Determine if the given key exists in the provided array or object. A key set to `null` still exists.

Exported as `exists` from `@tolki/arr` and `@tolki/obj`, and as `dataExists` from `@tolki/data`.

Laravel: [`Arr::exists()`](https://laravel.com/docs/helpers#method-array-exists)

```js [@tolki/data]
import { dataExists } from "@tolki/data";

dataExists(["a", "b"], 1);
// => true

dataExists({ name: "Desk" }, "sku");
// => false
```

#### filter

Filter the array or object using a callback. Without a callback, it removes the items that PHP treats as empty. See [Truthiness](https://tolki.abe.dev/arrays-objects/php-semantics.html#truthiness).

Exported as `filter` from `@tolki/arr` and `@tolki/obj`, and as `dataFilter` from `@tolki/data`.

```js [@tolki/data]
import { dataFilter } from "@tolki/data";

dataFilter([1, 2, 3, 4], (value) => value > 2);
// => [3, 4]

dataFilter({ a: 1, b: 2, c: 3 }, (value) => value > 1);
// => { b: 2, c: 3 }
```

#### first

Get the first item, or the first item that passes a truth test. When nothing is found, it returns the default value, or `null`.

Exported as `first` from `@tolki/arr` and `@tolki/obj`, and as `dataFirst` from `@tolki/data`.

Laravel: [`Arr::first()`](https://laravel.com/docs/helpers#method-array-first)

```js [@tolki/data]
import { dataFirst } from "@tolki/data";

dataFirst([1, 2, 3, 4], (value) => value > 2);
// => 3

dataFirst({ a: 1, b: 2, c: 3 }, (value) => value > 1);
// => 2

dataFirst([], null, "none");
// => "none"

function* naturals() {
  for (let n = 1; ; n++) {
    yield n;
  }
}

dataFirst(naturals(), (value) => value > 3);
// => 4
```

#### flatten

Flatten a multi-dimensional array or object into a single-level array of its values. The depth argument limits how many levels to flatten.

Exported as `flatten` from `@tolki/arr` and `@tolki/obj`, and as `dataFlatten` from `@tolki/data`.

Laravel: [`Arr::flatten()`](https://laravel.com/docs/helpers#method-array-flatten)

```js [@tolki/data]
import { dataFlatten } from "@tolki/data";

dataFlatten([1, [2, [3]]]);
// => [1, 2, 3]

dataFlatten({ a: 1, b: { c: 2 } });
// => [1, 2]
```

#### flip

Flip the keys and the values: each value becomes a key, and each key becomes its value.

Exported as `flip` from `@tolki/arr` and `@tolki/obj`, and as `dataFlip` from `@tolki/data`.

```js [@tolki/data]
import { dataFlip } from "@tolki/data";

dataFlip(["a", "b", "c"]);
// => { a: 0, b: 1, c: 2 }

dataFlip({ name: "taylor" });
// => { taylor: "name" }
```

#### float

Get a float item using "dot" notation, throwing an `InvalidArgumentException` if the value is not a number.

Exported as `float` from `@tolki/arr` and `@tolki/obj`, and as `dataFloat` from `@tolki/data`.

Laravel: [`Arr::float()`](https://laravel.com/docs/helpers#method-array-float)

```js [@tolki/data]
import { dataFloat } from "@tolki/data";

dataFloat({ product: { price: 19.99 } }, "product.price");
// => 19.99

dataFloat([{ price: 19.99 }], "0.price");
// => 19.99
```

<!-- docs/php-parity/Arr/float.json, "Arr::float rejects a whole-number int" -->

`float` accepts a whole number such as `1`, where Laravel's `Arr::float()` throws, because PHP's `is_float()` rejects an integer. JavaScript has one number type. See [Behaviour differences](https://tolki.abe.dev/arrays-objects/differences.html#behaviour-differences).

#### forget

Remove one or many items from an array or object using "dot" notation. It returns a new value and leaves the original unchanged. See [Return values instead of references](https://tolki.abe.dev/arrays-objects/differences.html#return-values-instead-of-references).

Exported as `forget` from `@tolki/arr` and `@tolki/obj`, and as `dataForget` from `@tolki/data`.

Laravel: [`Arr::forget()`](https://laravel.com/docs/helpers#method-array-forget) · [`data_forget()`](https://laravel.com/docs/helpers#method-data-forget)

```js [@tolki/data]
import { dataForget } from "@tolki/data";

dataForget({ user: { name: "John", age: 30 } }, "user.age");
// => { user: { name: "John" } }

dataForget(["a", "b", "c"], 1);
// => ["a", "c"]
```

#### from

Get the underlying array or object of items from the given argument: a list stays a list, and a `Map` becomes an object. A scalar throws an `InvalidArgumentException`.

Exported as `from` from `@tolki/arr` and `@tolki/obj`, and as `dataFrom` from `@tolki/data`.

Laravel: [`Arr::from()`](https://laravel.com/docs/helpers#method-array-from)

```js [@tolki/data]
import { dataFrom } from "@tolki/data";

dataFrom([1, 2]);
// => [1, 2]

dataFrom(new Map([["foo", "bar"]]));
// => { foo: "bar" }
```

#### get

Get an item from an array or object using "dot" notation. A missing path returns the default value, or `null`. See [Dot Notation](https://tolki.abe.dev/arrays-objects/dot-notation.html).

Exported as `get` from `@tolki/arr` and `@tolki/obj`, and as `dataGet` from `@tolki/data`.

Laravel: [`Arr::get()`](https://laravel.com/docs/helpers#method-array-get) · [`data_get()`](https://laravel.com/docs/helpers#method-data-get)

```js [@tolki/data]
import { dataGet } from "@tolki/data";

dataGet([{ price: 100 }], "0.price");
// => 100

dataGet({ desk: { price: 100 } }, "desk.price");
// => 100

dataGet({ desk: { price: 100 } }, "desk.discount");
// => null
```

#### has

Determine if an item or items exist in an array or object using "dot" notation. A key set to `null` still exists. When given several keys, all of them must exist. See [Dot Notation](https://tolki.abe.dev/arrays-objects/dot-notation.html).

Exported as `has` from `@tolki/arr` and `@tolki/obj`, and as `dataHas` from `@tolki/data`.

Laravel: [`Arr::has()`](https://laravel.com/docs/helpers#method-array-has)

```js [@tolki/data]
import { dataHas } from "@tolki/data";

dataHas([["a"], ["b"]], "0.0");
// => true

dataHas({ name: "John", address: { city: "NYC" } }, ["name", "address.city"]);
// => true
```

#### hasAll

Determine if all keys exist in an array or object using "dot" notation. See [Dot Notation](https://tolki.abe.dev/arrays-objects/dot-notation.html).

Exported as `hasAll` from `@tolki/arr` and `@tolki/obj`, and as `dataHasAll` from `@tolki/data`.

Laravel: [`Arr::hasAll()`](https://laravel.com/docs/helpers#method-array-hasall)

```js [@tolki/data]
import { dataHasAll } from "@tolki/data";

dataHasAll([["a"], ["b"]], ["0.0", "1.0"]);
// => true

dataHasAll({ name: "John" }, ["name", "email"]);
// => false
```

#### hasAny

Determine if any of the keys exist in an array or object using "dot" notation. See [Dot Notation](https://tolki.abe.dev/arrays-objects/dot-notation.html).

Exported as `hasAny` from `@tolki/arr` and `@tolki/obj`, and as `dataHasAny` from `@tolki/data`.

Laravel: [`Arr::hasAny()`](https://laravel.com/docs/helpers#method-array-hasany)

```js [@tolki/data]
import { dataHasAny } from "@tolki/data";

dataHasAny([["a"], ["b"]], ["0.5", "1.0"]);
// => true

dataHasAny({ name: "John" }, ["email", "phone"]);
// => false
```

#### integer

Get an integer item using "dot" notation, throwing an `InvalidArgumentException` if the value is not an integer.

Exported as `integer` from `@tolki/arr` and `@tolki/obj`, and as `dataInteger` from `@tolki/data`.

Laravel: [`Arr::integer()`](https://laravel.com/docs/helpers#method-array-integer)

```js [@tolki/data]
import { dataInteger } from "@tolki/data";

dataInteger({ user: { age: 30 } }, "user.age");
// => 30

dataInteger([{ age: 30 }], "0.age");
// => 30
```

#### intersect

Get the items whose values are also present in the other set. Values are compared as strings, so `2` matches `"2"`. The keys of the kept items stay with them in an object.

Exported as `intersect` from `@tolki/arr` and `@tolki/obj`, and as `dataIntersect` from `@tolki/data`.

```js [@tolki/data]
import { dataIntersect } from "@tolki/data";

dataIntersect(["a", "b", "c"], ["b", "c", "d"]);
// => ["b", "c"]

dataIntersect({ a: "green", b: "brown" }, { x: "green" });
// => { a: "green" }
```

#### intersectAssoc

Get the items whose key and value are both present in the other set.

Exported as `intersectAssoc` from `@tolki/arr` and `@tolki/obj`, and as `dataIntersectAssoc` from `@tolki/data`.

```js [@tolki/data]
import { dataIntersectAssoc } from "@tolki/data";

dataIntersectAssoc({ a: "green", b: "brown" }, { a: "green", b: "red" });
// => { a: "green" }
```

#### intersectAssocUsing

Get the items whose key and value are both present in the other set, using a callback to say whether two keys match.

Exported as `intersectAssocUsing` from `@tolki/arr` and `@tolki/obj`, and as `dataIntersectAssocUsing` from `@tolki/data`.

```js [@tolki/data]
import { dataIntersectAssocUsing } from "@tolki/data";

const same = (a, b) => a.toLowerCase() === b.toLowerCase();

dataIntersectAssocUsing({ a: "green", b: "brown" }, { A: "green" }, same);
// => { a: "green" }
```

#### intersectByKeys

Get the items whose key is present in the other set. Values are ignored.

Exported as `intersectByKeys` from `@tolki/arr` and `@tolki/obj`, and as `dataIntersectByKeys` from `@tolki/data`.

```js [@tolki/data]
import { dataIntersectByKeys } from "@tolki/data";

dataIntersectByKeys({ a: 1, b: 2, c: 3 }, { a: 0, c: 0 });
// => { a: 1, c: 3 }
```

#### intersectUsing

Get the items whose values are present in the other set, using a callback to say whether two values are equal.

Exported as `intersectUsing` from `@tolki/arr` and `@tolki/obj`, and as `dataIntersectUsing` from `@tolki/data`.

```js [@tolki/data]
import { dataIntersectUsing } from "@tolki/data";

const same = (a, b) => a.toLowerCase() === b.toLowerCase();

dataIntersectUsing(["Green", "Brown"], ["GREEN"], same);
// => ["Green"]
```

#### join

Join all items using a string. The final item can use a separate glue string.

Exported as `join` from `@tolki/arr` and `@tolki/obj`, and as `dataJoin` from `@tolki/data`.

Laravel: [`Arr::join()`](https://laravel.com/docs/helpers#method-array-join)

```js [@tolki/data]
import { dataJoin } from "@tolki/data";

dataJoin(["a", "b", "c"], ", ", " and ");
// => "a, b and c"

dataJoin({ a: "x", b: "y" }, ", ", " and ");
// => "x and y"
```

#### keyBy

Key an array or object of rows by a field, or by the result of a callback.

Exported as `keyBy` from `@tolki/arr` and `@tolki/obj`, and as `dataKeyBy` from `@tolki/data`.

Laravel: [`Arr::keyBy()`](https://laravel.com/docs/helpers#method-array-keyby)

```js [@tolki/data]
import { dataKeyBy } from "@tolki/data";

dataKeyBy(
  [
    { id: 1, name: "Desk" },
    { id: 2, name: "Chair" },
  ],
  "id",
);
// => { 1: { id: 1, name: "Desk" }, 2: { id: 2, name: "Chair" } }
```

#### keys

Get all of the keys of an array or object.

Exported as `keys` from `@tolki/arr` and `@tolki/obj`, and as `dataKeys` from `@tolki/data`.

```js [@tolki/data]
import { dataKeys } from "@tolki/data";

dataKeys(["a", "b"]);
// => [0, 1]

dataKeys({ name: "Desk", price: 100 });
// => ["name", "price"]
```

#### last

Get the last item, or the last item that passes a truth test. When nothing is found, it returns the default value, or `null`.

Exported as `last` from `@tolki/arr` and `@tolki/obj`, and as `dataLast` from `@tolki/data`.

Laravel: [`Arr::last()`](https://laravel.com/docs/helpers#method-array-last)

```js [@tolki/data]
import { dataLast } from "@tolki/data";

dataLast([1, 2, 3], (value) => value < 3);
// => 2

dataLast({ a: 1, b: 2, c: 3 });
// => 3
```

#### map

Run a map over each of the items in an array or object. The callback gets the value, then the index or key.

Exported as `map` from `@tolki/arr` and `@tolki/obj`, and as `dataMap` from `@tolki/data`.

Laravel: [`Arr::map()`](https://laravel.com/docs/helpers#method-array-map)

```js [@tolki/data]
import { dataMap } from "@tolki/data";

dataMap([1, 2, 3], (value) => value * 2);
// => [2, 4, 6]

dataMap({ a: 1, b: 2 }, (value) => value * 2);
// => { a: 2, b: 4 }
```

#### mapSpread

Run a map over each row, spreading the row's items into the callback's arguments, followed by the index or key.

Exported as `mapSpread` from `@tolki/arr` and `@tolki/obj`, and as `dataMapSpread` from `@tolki/data`.

Laravel: [`Arr::mapSpread()`](https://laravel.com/docs/helpers#method-array-map-spread)

```js [@tolki/data]
import { dataMapSpread } from "@tolki/data";

dataMapSpread(
  [
    [1, 2],
    [3, 4],
  ],
  (a, b) => a + b,
);
// => [3, 7]
```

#### mapWithKeys

Run an associative map over each of the items. The callback returns an object whose pairs become the entries of the result.

Exported as `mapWithKeys` from `@tolki/arr` and `@tolki/obj`, and as `dataMapWithKeys` from `@tolki/data`.

Laravel: [`Arr::mapWithKeys()`](https://laravel.com/docs/helpers#method-array-map-with-keys)

```js [@tolki/data]
import { dataMapWithKeys } from "@tolki/data";

dataMapWithKeys(["a", "b"], (value, index) => ({ [value]: index }));
// => { a: 0, b: 1 }
```

#### only

Get a subset of the items from the given array or object. The result keeps the order of the data, not the order of the keys.

Exported as `only` from `@tolki/arr` and `@tolki/obj`, and as `dataOnly` from `@tolki/data`.

Laravel: [`Arr::only()`](https://laravel.com/docs/helpers#method-array-only)

```js [@tolki/data]
import { dataOnly } from "@tolki/data";

dataOnly({ a: 1, b: 2, c: 3 }, ["a", "c"]);
// => { a: 1, c: 3 }

dataOnly(["a", "b", "c"], [0, 2]);
// => ["a", "c"]
```

#### onlyValues

Get a subset of the items from the given array or object by value. The comparison is loose, so `"1"` matches `1`; pass `true` as the third argument to compare strictly. See [PHP Semantics](https://tolki.abe.dev/arrays-objects/php-semantics.html#loose-and-strict-comparison).

Exported as `onlyValues` from `@tolki/arr` and `@tolki/obj`, and as `dataOnlyValues` from `@tolki/data`.

Laravel: [`Arr::onlyValues()`](https://laravel.com/docs/helpers#method-array-only-values)

<!-- docs/php-parity/Arr/onlyValues.json, "onlyValues-list-keeps-gap" -->

```js [@tolki/data]
import { dataOnlyValues } from "@tolki/data";

dataOnlyValues({ name: "taylor", age: 26 }, [26]);
// => { age: 26 }

dataOnlyValues(["foo", "bar", "baz"], ["foo", "baz"]);
// => ["foo", "baz"]
```

#### pad

Pad an array or object to the specified length with a value. A positive size pads at the end, and a negative size pads at the start.

Exported as `pad` from `@tolki/arr` and `@tolki/obj`, and as `dataPad` from `@tolki/data`.

```js [@tolki/data]
import { dataPad } from "@tolki/data";

dataPad([1, 2], 4, 0);
// => [1, 2, 0, 0]

dataPad({ a: 1, b: 2 }, 4, 0);
// => { 0: 0, 1: 0, a: 1, b: 2 }
```

#### partition

Partition an array or object into two using the given callback. The result is a pair: the items that pass, then the items that fail.

Exported as `partition` from `@tolki/arr` and `@tolki/obj`, and as `dataPartition` from `@tolki/data`.

Laravel: [`Arr::partition()`](https://laravel.com/docs/helpers#method-array-partition)

```js [@tolki/data]
import { dataPartition } from "@tolki/data";

dataPartition([1, 2, 3, 4], (value) => value > 2);
// => [[3, 4], [1, 2]]

dataPartition({ a: 1, b: 2, c: 3 }, (value) => value > 1);
// => [{ b: 2, c: 3 }, { a: 1 }]
```

#### pluck

Pluck an array of values from an array or object of rows. The path can be a dot path, and a `*` segment collects every item at that step; see [Wildcards](https://tolki.abe.dev/arrays-objects/dot-notation.html#wildcards).

Exported as `pluck` from `@tolki/arr` and `@tolki/obj`, and as `dataPluck` from `@tolki/data`.

Laravel: [`Arr::pluck()`](https://laravel.com/docs/helpers#method-array-pluck)

```js [@tolki/data]
import { dataPluck } from "@tolki/data";

dataPluck([{ name: "John" }, { name: "Jane" }], "name");
// => ["John", "Jane"]

dataPluck({ a: { name: "John" }, b: { name: "Jane" } }, "name");
// => ["John", "Jane"]
```

#### pop

Get and remove the last N items from an array or object. It changes the data you pass in, unlike most functions on this page. See [Return values instead of references](https://tolki.abe.dev/arrays-objects/differences.html#return-values-instead-of-references).

Exported as `pop` from `@tolki/arr` and `@tolki/obj`, and as `dataPop` from `@tolki/data`.

```js [@tolki/data]
import { dataPop } from "@tolki/data";

const stack = [1, 2, 3];

dataPop(stack);
// => 3

stack;
// => [1, 2]
```

#### prepend

Push an item onto the beginning of an array or object. It returns a new value and leaves the original unchanged.

Exported as `prepend` from `@tolki/arr` and `@tolki/obj`, and as `dataPrepend` from `@tolki/data`.

Laravel: [`Arr::prepend()`](https://laravel.com/docs/helpers#method-array-prepend)

```js [@tolki/data]
import { dataPrepend } from "@tolki/data";

dataPrepend([2, 3], 1);
// => [1, 2, 3]

dataPrepend({ b: 2, c: 3 }, 1, "a");
// => { a: 1, b: 2, c: 3 }
```

#### prependKeysWith

Prepend the key names of an array or object with the given string.

Exported as `prependKeysWith` from `@tolki/arr` and `@tolki/obj`, and as `dataPrependKeysWith` from `@tolki/data`.

Laravel: [`Arr::prependKeysWith()`](https://laravel.com/docs/helpers#method-array-prependkeyswith)

```js [@tolki/data]
import { dataPrependKeysWith } from "@tolki/data";

dataPrependKeysWith({ a: 1, b: 2 }, "item_");
// => { item_a: 1, item_b: 2 }
```

#### pull

Get a value from an array or object, and remove it. It returns `{ value, data }`, where `data` is what is left, and it leaves the original unchanged. See [Return values instead of references](https://tolki.abe.dev/arrays-objects/differences.html#return-values-instead-of-references).

Exported as `pull` from `@tolki/arr` and `@tolki/obj`, and as `dataPull` from `@tolki/data`.

Laravel: [`Arr::pull()`](https://laravel.com/docs/helpers#method-array-pull)

```js [@tolki/data]
import { dataPull } from "@tolki/data";

dataPull({ a: 1, b: 2 }, "b");
// => { value: 2, data: { a: 1 } }

dataPull(["a", "b", "c"], 1);
// => { value: "b", data: ["a", "c"] }
```

#### push

Push one or more items into the array at the given key, using "dot" notation. It returns a new value and leaves the original unchanged. See [Return values instead of references](https://tolki.abe.dev/arrays-objects/differences.html#return-values-instead-of-references).

Exported as `push` from `@tolki/arr` and `@tolki/obj`, and as `dataPush` from `@tolki/data`.

Laravel: [`Arr::push()`](https://laravel.com/docs/helpers#method-array-push)

```js [@tolki/data]
import { dataPush } from "@tolki/data";

dataPush({ a: [1, 2] }, "a", 3, 4);
// => { a: [1, 2, 3, 4] }

dataPush([1, 2], null, 3, 4);
// => [1, 2, 3, 4]
```

#### query

Convert an array or object into a URL-encoded query string.

Exported as `query` from `@tolki/arr` and `@tolki/obj`, and as `dataQuery` from `@tolki/data`.

Laravel: [`Arr::query()`](https://laravel.com/docs/helpers#method-array-query)

```js [@tolki/data]
import { dataQuery } from "@tolki/data";

dataQuery({ name: "John", age: 30 });
// => "name=John&age=30"

dataQuery(["a", "b"]);
// => "0=a&1=b"
```

#### random

Get one or a specified number of random values from an array or object. The picked items come back in the order they have in the data.

Exported as `random` from `@tolki/arr` and `@tolki/obj`, and as `dataRandom` from `@tolki/data`.

Laravel: [`Arr::random()`](https://laravel.com/docs/helpers#method-array-random)

```js [@tolki/data]
import { dataRandom } from "@tolki/data";

dataRandom([1, 2, 3, 4], 2);
// e.g. [2, 4]

dataRandom({ a: 1, b: 2, c: 3 }, 1);
// e.g. { 0: 2 }

dataRandom([1, 2, 3, 4], 3).length;
// => 3
```

#### reject

Filter an array or object using the negation of the given callback: the items that fail the test stay.

Exported as `reject` from `@tolki/arr` and `@tolki/obj`, and as `dataReject` from `@tolki/data`.

Laravel: [`Arr::reject()`](https://laravel.com/docs/helpers#method-array-reject)

```js [@tolki/data]
import { dataReject } from "@tolki/data";

dataReject([1, 2, 3], (value) => value > 1);
// => [1]

dataReject({ a: 1, b: 2, c: 3 }, (value) => value > 1);
// => { a: 1 }
```

#### replace

Replace the items of an array or object with the given replacer items. It returns a new value. Only the top level is replaced; see `replaceRecursive` for nested values.

Exported as `replace` from `@tolki/arr` and `@tolki/obj`, and as `dataReplace` from `@tolki/data`.

```js [@tolki/data]
import { dataReplace } from "@tolki/data";

dataReplace({ a: 1, b: 2 }, { b: 3, c: 4 });
// => { a: 1, b: 3, c: 4 }

dataReplace([1, 2, 3], [9]);
// => [9, 2, 3]
```

#### replaceRecursive

Recursively replace the items of an array or object with the given items. Two nested arrays or objects merge, and any other value is replaced. It returns a new value.

Exported as `replaceRecursive` from `@tolki/arr` and `@tolki/obj`, and as `dataReplaceRecursive` from `@tolki/data`.

```js [@tolki/data]
import { dataReplaceRecursive } from "@tolki/data";

dataReplaceRecursive(
  { user: { name: "John", age: 30 } },
  { user: { age: 31 } },
);
// => { user: { name: "John", age: 31 } }
```

#### reverse

Reverse the order of an array or object and return the result.

Exported as `reverse` from `@tolki/arr` and `@tolki/obj`, and as `dataReverse` from `@tolki/data`.

```js [@tolki/data]
import { dataReverse } from "@tolki/data";

dataReverse([1, 2, 3]);
// => [3, 2, 1]

dataReverse({ a: 1, b: 2, c: 3 });
// => { c: 3, b: 2, a: 1 }
```

#### search

Search for a value in an array or object and return its key. It returns `false` when nothing matches. The comparison is loose by default, so `"2"` matches `2`; pass `true` as the third argument to compare strictly. See [PHP Semantics](https://tolki.abe.dev/arrays-objects/php-semantics.html#loose-and-strict-comparison).

Exported as `dataSearch` from `@tolki/data`.

```js [@tolki/data]
import { dataSearch } from "@tolki/data";

dataSearch([1, 2, 3], 2);
// => 1

dataSearch({ a: 1, b: 2 }, 2);
// => "b"

dataSearch([1, 2, 3], "2");
// => 1

dataSearch([1, 2, 3], "2", true);
// => false

dataSearch({ a: 1, b: 5 }, (value) => value > 2);
// => "b"
```

#### select

Select an array or object of values from each item in an array or object. Each key is an exact name, not a dot path.

Exported as `select` from `@tolki/arr` and `@tolki/obj`, and as `dataSelect` from `@tolki/data`.

Laravel: [`Arr::select()`](https://laravel.com/docs/helpers#method-array-select)

```js [@tolki/data]
import { dataSelect } from "@tolki/data";

dataSelect([{ a: 1, b: 2, c: 3 }], ["a", "c"]);
// => [{ a: 1, c: 3 }]
```

#### set

Set an array or object item to a given value using "dot" notation. It returns a new value and leaves the original unchanged. See [Return values instead of references](https://tolki.abe.dev/arrays-objects/differences.html#return-values-instead-of-references).

Exported as `set` from `@tolki/arr` and `@tolki/obj`, and as `dataSet` from `@tolki/data`.

Laravel: [`Arr::set()`](https://laravel.com/docs/helpers#method-array-set) · [`data_set()`](https://laravel.com/docs/helpers#method-data-set)

```js [@tolki/data]
import { dataSet } from "@tolki/data";

dataSet({ a: 1 }, "b.c", 3);
// => { a: 1, b: { c: 3 } }

dataSet(["a", "b"], 1, "x");
// => ["a", "x"]
```

#### shift

Get and remove the first N items from an array or object. It changes the data you pass in, unlike most functions on this page. See [Return values instead of references](https://tolki.abe.dev/arrays-objects/differences.html#return-values-instead-of-references).

Exported as `shift` from `@tolki/arr` and `@tolki/obj`, and as `dataShift` from `@tolki/data`.

```js [@tolki/data]
import { dataShift } from "@tolki/data";

const queue = [1, 2, 3];

dataShift(queue);
// => 1

queue;
// => [2, 3]
```

#### shuffle

Shuffle an array or object and return the result. The result is a new value; an object comes back as a list-like object whose keys are `0` to `n - 1`.

Exported as `shuffle` from `@tolki/arr` and `@tolki/obj`, and as `dataShuffle` from `@tolki/data`.

Laravel: [`Arr::shuffle()`](https://laravel.com/docs/helpers#method-array-shuffle)

```js [@tolki/data]
import { dataShuffle } from "@tolki/data";

dataShuffle([1, 2, 3, 4]);
// e.g. [3, 1, 4, 2]

dataShuffle([1, 2, 3, 4]).length;
// => 4
```

#### skipUntil

Skip items in an array or object until the given condition is met, and return the rest. The condition is a value, matched strictly, so `"2"` does not match `2`, or a callback.

Exported as `skipUntil` from `@tolki/arr` and `@tolki/obj`, and as `dataSkipUntil` from `@tolki/data`.

```js [@tolki/data]
import { dataSkipUntil } from "@tolki/data";

dataSkipUntil([1, 2, 3, 4], 3);
// => [3, 4]

dataSkipUntil({ a: 1, b: 2, c: 3 }, (value) => value > 1);
// => { b: 2, c: 3 }
```

#### skipWhile

Skip items in an array or object while the given condition is met, and return the rest. The condition is a value, matched strictly, or a callback.

Exported as `skipWhile` from `@tolki/arr` and `@tolki/obj`, and as `dataSkipWhile` from `@tolki/data`.

```js [@tolki/data]
import { dataSkipWhile } from "@tolki/data";

dataSkipWhile([1, 1, 2, 1], 1);
// => [2, 1]

dataSkipWhile({ a: 1, b: 2, c: 3 }, (value) => value < 2);
// => { b: 2, c: 3 }
```

#### slice

Get a portion of an array or object, starting at an offset. The original is left unchanged; `splice` is the function that removes items.

Exported as `slice` from `@tolki/arr` and `@tolki/obj`, and as `dataSlice` from `@tolki/data`.

```js [@tolki/data]
import { dataSlice } from "@tolki/data";

dataSlice([1, 2, 3, 4], 1, 2);
// => [2, 3]

dataSlice({ a: 1, b: 2, c: 3 }, 1);
// => { b: 2, c: 3 }
```

#### sole

Get the first item, but only if exactly one item exists. Otherwise it throws `ItemNotFoundException` when none is found, or `MultipleItemsFoundException` when several are. With a callback, it counts only the items the callback accepts.

Exported as `sole` from `@tolki/arr` and `@tolki/obj`, and as `dataSole` from `@tolki/data`.

Laravel: [`Arr::sole()`](https://laravel.com/docs/helpers#method-array-sole)

```js [@tolki/data]
import { dataSole } from "@tolki/data";

dataSole([42]);
// => 42

dataSole({ a: 1, b: 2 }, (value) => value > 1);
// => 2

dataSole([1, 2]);
// => throws MultipleItemsFoundException
```

#### some

Determine if some items pass the given truth test.

Exported as `some` from `@tolki/arr` and `@tolki/obj`, and as `dataSome` from `@tolki/data`.

Laravel: [`Arr::some()`](https://laravel.com/docs/helpers#method-array-some)

```js [@tolki/data]
import { dataSome } from "@tolki/data";

dataSome([1, 3, 5], (value) => value % 2 === 0);
// => false

dataSome({ a: 1, b: 2 }, (value) => value > 1);
// => true
```

#### sort

Sort an array or object by its values, by a callback, by a "dot" path, or by a list of sort descriptors. It returns a new value and leaves the original unchanged.

Exported as `sort` from `@tolki/arr` and `@tolki/obj`, and as `dataSort` from `@tolki/data`.

Laravel: [`Arr::sort()`](https://laravel.com/docs/helpers#method-array-sort)

```js [@tolki/data]
import { dataSort } from "@tolki/data";

dataSort([3, 1, 2]);
// => [1, 2, 3]

dataSort({ a: 3, b: 1, c: 2 });
// => { b: 1, c: 2, a: 3 }
```

#### sortDesc

Sort an array or object in descending order. It takes the same callbacks, paths and descriptors as `sort`, and returns a new value.

Exported as `sortDesc` from `@tolki/arr` and `@tolki/obj`, and as `dataSortDesc` from `@tolki/data`.

Laravel: [`Arr::sortDesc()`](https://laravel.com/docs/helpers#method-array-sort-desc)

```js [@tolki/data]
import { dataSortDesc } from "@tolki/data";

dataSortDesc([3, 1, 2]);
// => [3, 2, 1]

dataSortDesc({ a: 3, b: 1, c: 2 });
// => { a: 3, c: 2, b: 1 }
```

#### sortRecursive

Recursively sort an array or object by its keys and values. Nested lists sort by value and nested objects sort by key.

Exported as `sortRecursive` from `@tolki/arr` and `@tolki/obj`, and as `dataSortRecursive` from `@tolki/data`.

Laravel: [`Arr::sortRecursive()`](https://laravel.com/docs/helpers#method-array-sort-recursive)

```js [@tolki/data]
import { dataSortRecursive } from "@tolki/data";

dataSortRecursive({ b: [3, 1, 2], a: { d: 2, c: 1 } });
// => { a: { c: 1, d: 2 }, b: [1, 2, 3] }

dataSortRecursive([
  [3, 1, 2],
  [9, 8],
]);
// => [[8, 9], [1, 2, 3]]
```

#### sortRecursiveDesc

Recursively sort an array or object by its keys and values in descending order.

Exported as `sortRecursiveDesc` from `@tolki/arr` and `@tolki/obj`, and as `dataSortRecursiveDesc` from `@tolki/data`.

```js [@tolki/data]
import { dataSortRecursiveDesc } from "@tolki/data";

dataSortRecursiveDesc({ a: [1, 2, 3], b: { c: 1, d: 2 } });
// => { b: { d: 2, c: 1 }, a: [3, 2, 1] }

dataSortRecursiveDesc([
  [1, 3, 2],
  [8, 9],
]);
// => [[3, 2, 1], [9, 8]]
```

#### splice

Remove a portion of an array or object, optionally put replacements in its place, and return what was removed. It changes the data you pass in, unlike most functions on this page. See [Return values instead of references](https://tolki.abe.dev/arrays-objects/differences.html#return-values-instead-of-references).

Exported as `splice` from `@tolki/arr` and `@tolki/obj`, and as `dataSplice` from `@tolki/data`.

```js [@tolki/data]
import { dataSplice } from "@tolki/data";

const queue = [1, 2, 3, 4, 5];

dataSplice(queue, 1, 2);
// => [2, 3]

queue;
// => [1, 4, 5]
```

#### string

Get a string item using "dot" notation, throwing an `InvalidArgumentException` if the value is not a string.

Exported as `string` from `@tolki/arr` and `@tolki/obj`, and as `dataString` from `@tolki/data`.

Laravel: [`Arr::string()`](https://laravel.com/docs/helpers#method-array-string)

```js [@tolki/data]
import { dataString } from "@tolki/data";

dataString({ user: { name: "John" } }, "user.name");
// => "John"

dataString(["a", 1], 0);
// => "a"

dataString(["a", 1], 1);
// => throws InvalidArgumentException
```

#### take

Take the first or last N items of an array or object. A negative number takes from the end.

Exported as `take` from `@tolki/arr` and `@tolki/obj`, and as `dataTake` from `@tolki/data`.

Laravel: [`Arr::take()`](https://laravel.com/docs/helpers#method-array-take)

```js [@tolki/data]
import { dataTake } from "@tolki/data";

dataTake([1, 2, 3, 4], 2);
// => [1, 2]

dataTake({ a: 1, b: 2, c: 3 }, -1);
// => { c: 3 }
```

#### takeUntil

Take items from an array or object until the given condition is met. The condition is a value, matched strictly, or a callback.

Exported as `takeUntil` from `@tolki/arr` and `@tolki/obj`, and as `dataTakeUntil` from `@tolki/data`.

```js [@tolki/data]
import { dataTakeUntil } from "@tolki/data";

dataTakeUntil([1, 2, 3, 4], 3);
// => [1, 2]

dataTakeUntil({ a: 1, b: 2, c: 3 }, (value) => value > 1);
// => { a: 1 }
```

#### takeWhile

Take items from an array or object while the given condition is met. The condition is a value, matched strictly, or a callback.

Exported as `takeWhile` from `@tolki/arr` and `@tolki/obj`, and as `dataTakeWhile` from `@tolki/data`.

```js [@tolki/data]
import { dataTakeWhile } from "@tolki/data";

dataTakeWhile([1, 1, 2, 2], 1);
// => [1, 1]

dataTakeWhile({ a: 1, b: 2, c: 3 }, (value) => value < 3);
// => { a: 1, b: 2 }
```

#### toCssClasses

Conditionally compile CSS classes into a class list. A plain entry is always kept. A `class: condition` entry is kept when its condition is true.

Exported as `toCssClasses` from `@tolki/arr` and `@tolki/obj`, and as `dataToCssClasses` from `@tolki/data`.

Laravel: [`Arr::toCssClasses()`](https://laravel.com/docs/helpers#method-array-to-css-classes)

```js [@tolki/data]
import { dataToCssClasses } from "@tolki/data";

dataToCssClasses(["a", "b"]);
// => "a b"

dataToCssClasses({ "p-4": true, hidden: false });
// => "p-4"
```

#### toCssStyles

Conditionally compile CSS styles into a style list. Each style ends with a semicolon, and the styles are separated by a space.

Exported as `toCssStyles` from `@tolki/arr` and `@tolki/obj`, and as `dataToCssStyles` from `@tolki/data`.

Laravel: [`Arr::toCssStyles()`](https://laravel.com/docs/helpers#method-array-to-css-styles)

```js [@tolki/data]
import { dataToCssStyles } from "@tolki/data";

dataToCssStyles(["color: red"]);
// => "color: red;"

dataToCssStyles({ "color: red": true, "display: none": false });
// => "color: red;"
```

#### undot

Expand a flat object with "dot" keys into a nested array or object.

Exported as `undot` from `@tolki/arr` and `@tolki/obj`, and as `dataUndot` from `@tolki/data`.

Laravel: [`Arr::undot()`](https://laravel.com/docs/helpers#method-array-undot)

```js [@tolki/data]
import { dataUndot } from "@tolki/data";

dataUndot({ "a.b": 1, "a.c": 2 });
// => { a: { b: 1, c: 2 } }

dataUndot({ 0: "a", "1.0": "b" });
// => { 0: "a", 1: ["b"] }
```

#### union

Union arrays or objects into one. An earlier argument wins: a later one only adds the keys the result does not have yet.

Exported as `union` from `@tolki/arr` and `@tolki/obj`, and as `dataUnion` from `@tolki/data`.

```js [@tolki/data]
import { dataUnion } from "@tolki/data";

dataUnion({ a: 1 }, { a: 2, b: 3 });
// => { a: 1, b: 3 }

dataUnion([1, 2], [3, 4, 5]);
// => [1, 2, 5]
```

#### unshift

Prepend one or more items to the start of an array or object. It changes the data you pass in, unlike most functions on this page. See [Return values instead of references](https://tolki.abe.dev/arrays-objects/differences.html#return-values-instead-of-references).

Exported as `unshift` from `@tolki/arr` and `@tolki/obj`, and as `dataUnshift` from `@tolki/data`.

```js [@tolki/data]
import { dataUnshift } from "@tolki/data";

const queue = [3];

dataUnshift(queue, 1, 2);
// => [1, 2, 3]

queue;
// => [1, 2, 3]
```

#### values

Get all the values of an array or object as a list.

Exported as `values` from `@tolki/arr` and `@tolki/obj`, and as `dataValues` from `@tolki/data`.

```js [@tolki/data]
import { dataValues } from "@tolki/data";

dataValues({ a: 1, b: 2 });
// => [1, 2]

dataValues([1, 2]);
// => [1, 2]
```

#### where

Filter an array or object using the given callback. A list comes back renumbered from 0; see [Behaviour differences](https://tolki.abe.dev/arrays-objects/differences.html#behaviour-differences).

Exported as `where` from `@tolki/arr` and `@tolki/obj`, and as `dataWhere` from `@tolki/data`.

Laravel: [`Arr::where()`](https://laravel.com/docs/helpers#method-array-where)

```js [@tolki/data]
import { dataWhere } from "@tolki/data";

dataWhere([1, 2, 3], (value) => value > 1);
// => [2, 3]

dataWhere({ a: 1, b: 2, c: 3 }, (value) => value > 1);
// => { b: 2, c: 3 }
```

#### whereNotNull

Filter an array or object, removing the items whose value is `null`. Only `null` is removed; an `undefined` item stays. A list comes back renumbered from 0; see [Behaviour differences](https://tolki.abe.dev/arrays-objects/differences.html#behaviour-differences).

Exported as `whereNotNull` from `@tolki/arr` and `@tolki/obj`, and as `dataWhereNotNull` from `@tolki/data`.

Laravel: [`Arr::whereNotNull()`](https://laravel.com/docs/helpers#method-array-where-not-null)

```js [@tolki/data]
import { dataWhereNotNull } from "@tolki/data";

dataWhereNotNull([1, null, 3]);
// => [1, 3]

dataWhereNotNull({ a: 1, b: null, c: 3 });
// => { a: 1, c: 3 }

dataWhereNotNull([1, undefined, null]);
// => [1, undefined]
```

## Dot Notation

A dot path is a string such as `"user.address.city"` that reaches into nested arrays and objects in one call. `@tolki/arr`, `@tolki/obj`, `@tolki/data` and the `Collection` methods all read the same paths.

### Path syntax

Each segment between the dots is an object key or an array index. A number segment picks that position of an array. A path that leads nowhere gives the default, which is `null` when you leave it out.

```js [@tolki/data]
import { dataGet } from "@tolki/data";

dataGet([{ items: ["a", "b"] }], "0.items.1");
// => "b"

dataGet({ desk: { sizes: ["s", "m"] } }, "desk.color", "none");
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
- **Convert:** `dot` turns a nested structure into a flat object of paths, and `undot` turns it back.

```js [@tolki/data]
import {
  dataDot,
  dataExcept,
  dataForget,
  dataHas,
  dataInteger,
  dataPull,
  dataPush,
  dataSet,
  dataUndot,
} from "@tolki/data";

dataHas([{ a: 1 }], "0.a");
// => true

dataSet({}, "a.b.c", 1);
// => { a: { b: { c: 1 } } }

dataExcept({ a: { b: 1, c: 2 }, d: 3 }, ["a.b"]);
// => { a: { c: 2 }, d: 3 }

dataInteger({ a: { b: 2 } }, "a.b");
// => 2

dataDot({ a: { b: 1, c: [2] } });
// => { "a.b": 1, "a.c.0": 2 }

dataUndot({ "a.b": 1, "a.c": 2 });
// => { a: { b: 1, c: 2 } }

dataPush({}, "a.b", 1);
// => { a: { b: [1] } }

dataForget({ a: 1 }, "b.c");
// => { a: 1 }

dataPull({ a: 1 }, "b.c");
// => { value: null, data: { a: 1 } }
```

### Wildcards

A `*` segment stands for every item at that step, and `pluck` collects what lies behind it. The result has one entry per item in front of the `*`.

<!-- docs/php-parity/Arr/pluck.json, "Arr::pluck wildcard path", "Arr::pluck wildcard + key" -->

Laravel's `Arr::pluck()` reads a `*` the same way, and the port returns the same shape.

```js [@tolki/data]
import { dataPluck } from "@tolki/data";

const posts = [
  { title: "A", tags: [{ id: 1 }, { id: 2 }] },
  { title: "B", tags: [{ id: 3 }] },
];

dataPluck(posts, "tags.*.id");
// => [[1, 2], [3]]

dataPluck(posts, "tags.*.id", "title");
// => { A: [1, 2], B: [3] }
```

### Where wildcards do not work

Of the functions above, only `pluck` reads a `*`. `get`, `has` and their `data` versions take it as the name of a key, so a path with `*` finds nothing. The same goes for the `{first}` and `{last}` segments.

<!-- docs/php-parity/Helpers/data_get.json, "data-get-wildcard-and-first-last-segments" -->

Laravel's `data_get()` expands both of them. See [Differences from Laravel](https://tolki.abe.dev/arrays-objects/differences.html#behaviour-differences) for the full list.

```js [@tolki/data]
import { dataGet, dataHas } from "@tolki/data";

dataGet({ a: { n: 1 }, b: { n: 2 } }, "*.n");
// => null

dataHas({ a: { n: 1 } }, "*.n");
// => false

dataGet({ s: [{ x: 1 }, { x: 2 }] }, "s.{first}.x");
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

```js [@tolki/data]
import { dataContains, dataContainsStrict } from "@tolki/data";

dataContains([1, 2, 3], "1");
// => true

dataContainsStrict({ a: "1" }, 1);
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

```js [@tolki/data]
import { dataWhere } from "@tolki/data";

dataWhere(["a", "b"], () => "0");
// => []

dataWhere({ x: "a", y: "b" }, () => "0.0");
// => { x: "a", y: "b" }
```

### Key casting

PHP stores a string key that reads as a plain integer, such as `"10"`, as the number `10`. A string such as `"01"` stays a string. The port does the same, so a callback gets a number for `"10"` and a string for `"01"`, and `keys` lists them that way.

<!-- docs/php-parity/Collection/callback-key-types.json, "C32-E-callback-key-types-sweep" -->
<!-- docs/php-parity/Arr/set.json, "set-record-key-cast" -->

A callback sees the number `1` for the key `"1"` and a string for `"x"`, and `set` writes the key `"1"` as an integer but `"01"` as a string.

```js [@tolki/data]
import { dataKeys } from "@tolki/data";

dataKeys({ 10: "a", "01": "b", x: "c" });
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

```js [@tolki/data]
import { dataForget, dataPull, dataPush, dataSet } from "@tolki/data";

const desk = { price: { amount: 100, tax: 7 }, tags: ["a"] };

dataSet(desk, "price.amount", 200);
// => { price: { amount: 200, tax: 7 }, tags: ["a"] }

dataForget(desk, "price.tax");
// => { price: { amount: 100 }, tags: ["a"] }

dataPush(desk, "tags", "b");
// => { price: { amount: 100, tax: 7 }, tags: ["a", "b"] }

dataPull(desk, "price.tax");
// => { value: 7, data: { price: { amount: 100 }, tags: ["a"] } }

desk;
// => { price: { amount: 100, tax: 7 }, tags: ["a"] }
```

`shift`, `pop`, `splice` and `unshift` are different. Laravel gets them from `Collection`, which changes itself, and the functions keep that: they change the array or object you pass and return what came out (or the changed value, for `unshift`).

<!-- docs/php-parity/Collection/shift.json, "X2 shift mutates and returns the first value" -->
<!-- docs/php-parity/Collection/pop.json, "X1 pop mutates and returns the last value" -->
<!-- docs/php-parity/Collection/splice.json, "X6 splice mutates and returns the removed items" -->
<!-- docs/php-parity/Collection/unshift.json, "X5 unshift mutates and renumbers integer keys" -->

```js [@tolki/data]
import { dataPop, dataShift } from "@tolki/data";

const queue = [1, 2, 3];

dataShift(queue);
// => 1

dataPop(queue);
// => 3

queue;
// => [2]
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

```js [@tolki/data]
import { dataItem } from "@tolki/data";

dataItem([{ tags: ["a"] }], "0.tags");
// => ["a"]

dataItem({ desk: { price: 100 } }, "desk");
// => { price: 100 }
```

### JavaScript-only additions

- Functions Laravel has on `Collection` rather than on `Arr`. All three packages export `chunk`, `chunkBy`, `chunkWhile`, `combine`, `contains`, `containsStrict`, the `diff` and `intersect` families, `filter`, `flip`, `keys`, `pad`, `pop`, `replace`, `replaceRecursive`, `reverse`, `shift`, `skipUntil`, `skipWhile`, `slice`, `splice`, `takeUntil`, `takeWhile`, `union`, `unshift` and `values`. `@tolki/data` also has `dataCount`, `dataSearch`, `dataBefore` and `dataAfter`. <!-- docs/php-parity/Collection/search.json, "search-callback"; docs/php-parity/Collection/before.json, "before-array-needle"; docs/php-parity/Collection/after.json, "after-array-needle"; docs/php-parity/Collection/count.json, "count-empty" -->
- `flattenDot` in `@tolki/obj` flattens like `dot` but drops an empty nested object or array, where `dot` keeps it as a value, as Laravel's `Arr::dot()` does. <!-- docs/php-parity/Arr/dot.json, "dot-empty-leaf", "dot-nested-empty-leaf" -->
- `dataUndot(data, true)` builds a list from paths made of whole numbers such as `"0.1"`, as `undot` from `@tolki/arr` always does. It throws a `TypeError` for any other path.
- `@tolki/obj` and `@tolki/data` read a `Map`, and `@tolki/data` reads a `Set` and a generator as a list.

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
import { dot, flattenDot } from "@tolki/obj";

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
```

<!-- AUTO-GENERATED-DOCS:END -->
