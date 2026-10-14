# Tolki Array & Object Utilities List

<script setup>
import { accessible, arrayable, wrap } from "@tolki/arr";
import {
  dataAdd,
  dataAfter,
  dataBefore,
  dataBoolean,
  dataChunk,
  dataChunkBy,
  dataChunkWhile,
  dataCollapse,
  dataCombine,
  dataContains,
  dataContainsStrict,
  dataCount,
  dataCrossJoin,
  dataDiff,
  dataDiffAssoc,
  dataDiffAssocUsing,
  dataDiffKeys,
  dataDiffKeysUsing,
  dataDiffUsing,
  dataDivide,
  dataDot,
  dataEvery,
  dataItem,
  dataExcept,
  dataExceptValues,
  dataExists,
  dataFilter,
  dataFirst,
  dataFlatten,
  dataFlip,
  dataFloat,
  dataForget,
  dataFrom,
  dataGet,
  dataHas,
  dataHasAll,
  dataHasAny,
  dataInteger,
  dataIntersect,
  dataIntersectAssoc,
  dataIntersectAssocUsing,
  dataIntersectByKeys,
  dataIntersectUsing,
  dataJoin,
  dataKeyBy,
  dataKeys,
  dataLast,
  dataMap,
  dataMapSpread,
  dataMapWithKeys,
  dataOnly,
  dataOnlyValues,
  dataPad,
  dataPartition,
  dataPluck,
  dataPop,
  dataPrepend,
  dataPrependKeysWith,
  dataPull,
  dataPush,
  dataQuery,
  dataRandom,
  dataReject,
  dataReplace,
  dataReplaceRecursive,
  dataReverse,
  dataSearch,
  dataSelect,
  dataSet,
  dataShift,
  dataShuffle,
  dataSkipUntil,
  dataSkipWhile,
  dataSlice,
  dataSole,
  dataSome,
  dataSort,
  dataSortDesc,
  dataSortRecursive,
  dataSortRecursiveDesc,
  dataSplice,
  dataString,
  dataTake,
  dataTakeUntil,
  dataTakeWhile,
  dataToCssClasses,
  dataToCssStyles,
  dataUndot,
  dataUnion,
  dataUnshift,
  dataValues,
  dataWhere,
  dataWhereNotNull,
} from "@tolki/data";
import { flattenDot } from "@tolki/obj";

// Callback arguments cannot be typed into a field, so the playground offers presets.
const predicates = [
  { label: "v > 1", value: (v) => v > 1 },
  { label: "v > 0", value: (v) => v > 0 },
  { label: "v is even", value: (v) => v % 2 === 0 },
];

const chunkByCallbacks = [
  { label: "the value itself", value: (v) => v },
  { label: "v is even", value: (v) => v % 2 === 0 },
];

const chunkWhileCallbacks = [
  {
    label: "same as the last in the chunk",
    value: (v, k, chunk) => Object.values(chunk).at(-1) === v,
  },
  {
    label: "one more than the last in the chunk",
    value: (v, k, chunk) => Object.values(chunk).at(-1) + 1 === v,
  },
];

const keyComparators = [
  {
    label: "ignoring case",
    value: (a, b) => String(a).toLowerCase() === String(b).toLowerCase(),
  },
  { label: "exactly equal", value: (a, b) => a === b },
];
const mapCallbacks = [
  { label: "double the value", value: (v) => v * 2 },
  { label: "describe the key and value", value: (v, k) => `${k}:${v}` },
];

const spreadCallbacks = [
  { label: "add the two items", value: (a, b) => a + b },
  { label: "join the two items", value: (a, b) => `${a}-${b}` },
];

const keyedCallbacks = [
  { label: "the value becomes the key", value: (v, k) => ({ [v]: k }) },
  { label: "prefix the key", value: (v, k) => ({ [`item_${k}`]: v }) },
];
</script>

These utilities work on arrays with `@tolki/arr`, on plain objects with `@tolki/obj`, and on either one with `@tolki/data`. Every section has a tab for each package that exports the function, and the page remembers the tab you pick, so the next visit starts on the same one.

## Utilities List

<div class="collection-method-list" markdown="1">

[accessible](#accessible) [add](#add) [after](#after) [arrayable](#arrayable) [arrayItem](#arrayitem) [before](#before) [boolean](#boolean) [chunk](#chunk) [chunkBy](#chunkby) [chunkWhile](#chunkwhile) [collapse](#collapse) [combine](#combine) [contains](#contains) [containsStrict](#containsstrict) [count](#count) [crossJoin](#crossjoin) [diff](#diff) [diffAssoc](#diffassoc) [diffAssocUsing](#diffassocusing) [diffKeys](#diffkeys) [diffKeysUsing](#diffkeysusing) [diffUsing](#diffusing) [divide](#divide) [dot](#dot) [every](#every) [except](#except) [exceptValues](#exceptvalues) [exists](#exists) [filter](#filter) [first](#first) [flatten](#flatten) [flattenDot](#flattendot) [flip](#flip) [float](#float) [forget](#forget) [from](#from) [get](#get) [has](#has) [hasAll](#hasall) [hasAny](#hasany) [integer](#integer) [intersect](#intersect) [intersectAssoc](#intersectassoc) [intersectAssocUsing](#intersectassocusing) [intersectByKeys](#intersectbykeys) [intersectUsing](#intersectusing) [join](#join) [keyBy](#keyby) [keys](#keys) [last](#last) [map](#map) [mapSpread](#mapspread) [mapWithKeys](#mapwithkeys) [only](#only) [onlyValues](#onlyvalues) [pad](#pad) [partition](#partition) [pluck](#pluck) [pop](#pop) [prepend](#prepend) [prependKeysWith](#prependkeyswith) [pull](#pull) [push](#push) [query](#query) [random](#random) [reject](#reject) [replace](#replace) [replaceRecursive](#replacerecursive) [reverse](#reverse) [search](#search) [select](#select) [set](#set) [shift](#shift) [shuffle](#shuffle) [skipUntil](#skipuntil) [skipWhile](#skipwhile) [slice](#slice) [sole](#sole) [some](#some) [sort](#sort) [sortDesc](#sortdesc) [sortRecursive](#sortrecursive) [sortRecursiveDesc](#sortrecursivedesc) [splice](#splice) [string](#string) [take](#take) [takeUntil](#takeuntil) [takeWhile](#takewhile) [toCssClasses](#tocssclasses) [toCssStyles](#tocssstyles) [undot](#undot) [union](#union) [unshift](#unshift) [values](#values) [where](#where) [whereNotNull](#wherenotnull) [wrap](#wrap)

</div>

## Utilities Details

### accessible

Determine whether the given value is array accessible: a list in `@tolki/arr`, a plain object or a `Map` in `@tolki/obj`.

Exported as `accessible` from `@tolki/arr` and `@tolki/obj`.

Laravel: [`Arr::accessible()`](https://laravel.com/docs/helpers#method-array-accessible)

::: code-group

```js [@tolki/arr]
import { accessible } from "@tolki/arr";

accessible([1, 2]);
// => true

accessible({ a: 1, b: 2 });
// => false

accessible("abc");
// => false
```

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

:::

<FnTry label="accessible" :fn="accessible" :args="[
  { name: 'value', type: 'json', default: [1, 2] },
]" />

### add

Add an element using "dot" notation if it doesn't exist. A key that is missing or set to `null` counts as not existing.

Exported as `add` from `@tolki/arr` and `@tolki/obj`, and as `dataAdd` from `@tolki/data`.

Laravel: [`Arr::add()`](https://laravel.com/docs/helpers#method-array-add)

::: code-group

```js [@tolki/arr]
import { add } from "@tolki/arr";

add([["Desk"]], "0.1", 100);
// => [["Desk", 100]]

add([["Desk", 100]], "0.1", 200);
// => [["Desk", 100]]
```

```js [@tolki/obj]
import { add } from "@tolki/obj";

add({ name: "Desk" }, "price", 100);
// => { name: "Desk", price: 100 }

add({ name: "Desk", price: null }, "price", 100);
// => { name: "Desk", price: 100 }

add({ name: "Desk", price: 50 }, "price", 100);
// => { name: "Desk", price: 50 }
```

```js [@tolki/data]
import { dataAdd } from "@tolki/data";

dataAdd([1, 2], 2, 3);
// => [1, 2, 3]

dataAdd({ name: "Desk" }, "price", 100);
// => { name: "Desk", price: 100 }
```

:::

<FnTry label="dataAdd" :fn="dataAdd" :args="[
  { name: 'data', type: 'json', default: { name: 'Desk' } },
  { name: 'key', default: 'price' },
  { name: 'value', type: 'json', default: 100 },
]" />

### after

Get the item after a specified value, or `null` when the value is the last one or is not found.

Exported as `dataAfter` from `@tolki/data`.

::: code-group

```js [@tolki/data]
import { dataAfter } from "@tolki/data";

dataAfter([1, 2, 3], 2);
// => 3

dataAfter({ a: 1, b: 2, c: 3 }, 2);
// => 3

dataAfter([1, 2, 3], 3);
// => null
```

:::

<FnTry label="dataAfter" :fn="dataAfter" :args="[
  { name: 'data', type: 'json', default: [1, 2, 3] },
  { name: 'value', type: 'json', default: 2 },
]" />

### arrayable

Determine whether the given value is arrayable: a list in `@tolki/arr`, a plain object in `@tolki/obj`.

Exported as `arrayable` from `@tolki/arr` and as `objectifiable` from `@tolki/obj`.

::: code-group

```js [@tolki/arr]
import { arrayable } from "@tolki/arr";

arrayable([1, 2]);
// => true

arrayable({ a: 1 });
// => false
```

```js [@tolki/obj]
import { objectifiable } from "@tolki/obj";

objectifiable({ a: 1 });
// => true

objectifiable([1, 2]);
// => false

objectifiable(new Date());
// => false
```

:::

<FnTry label="arrayable" :fn="arrayable" :args="[
  { name: 'value', type: 'json', default: [1, 2] },
]" />

### arrayItem

Get an item using "dot" notation, throwing an `InvalidArgumentException` unless it is a list (`@tolki/arr`) or a plain object (`@tolki/obj`). `dataItem` expects the kind that matches its first argument.

Exported as `arrayItem` from `@tolki/arr`, as `objectItem` from `@tolki/obj` and as `dataItem` from `@tolki/data`.

Laravel: [`Arr::array()`](https://laravel.com/docs/helpers#method-array-array)

::: code-group

```js [@tolki/arr]
import { arrayItem } from "@tolki/arr";

arrayItem([{ tags: ["a", "b"] }], "0.tags");
// => ["a", "b"]

arrayItem([{ tags: "a" }], "0.tags");
// => throws InvalidArgumentException
```

```js [@tolki/obj]
import { objectItem } from "@tolki/obj";

objectItem({ desk: { price: 100 } }, "desk");
// => { price: 100 }

objectItem({ desk: { price: 100 } }, "desk.price");
// => throws InvalidArgumentException
```

```js [@tolki/data]
import { dataItem } from "@tolki/data";

dataItem([{ tags: ["a", "b"] }], "0.tags");
// => ["a", "b"]

dataItem({ desk: { price: 100 } }, "desk");
// => { price: 100 }

dataItem({ desk: { price: 100 } }, "desk.price");
// => throws InvalidArgumentException
```

:::

<FnTry label="dataItem" :fn="dataItem" :args="[
  { name: 'data', type: 'json', default: { desk: { price: 100 } } },
  { name: 'key', default: 'desk' },
]" />

### before

Get the item before a specified value, or `null` when the value is the first one or is not found.

Exported as `dataBefore` from `@tolki/data`.

::: code-group

```js [@tolki/data]
import { dataBefore } from "@tolki/data";

dataBefore([1, 2, 3], 2);
// => 1

dataBefore({ a: 1, b: 2, c: 3 }, 2);
// => 1

dataBefore([1, 2, 3], 1);
// => null
```

:::

<FnTry label="dataBefore" :fn="dataBefore" :args="[
  { name: 'data', type: 'json', default: [1, 2, 3] },
  { name: 'value', type: 'json', default: 2 },
]" />

### boolean

Get a boolean item using "dot" notation, throwing an `InvalidArgumentException` if the value is not a boolean.

Exported as `boolean` from `@tolki/arr` and `@tolki/obj`, and as `dataBoolean` from `@tolki/data`.

Laravel: [`Arr::boolean()`](https://laravel.com/docs/helpers#method-array-boolean)

::: code-group

```js [@tolki/arr]
import { boolean } from "@tolki/arr";

boolean([{ available: true }], "0.available");
// => true

boolean([{ name: "Joe" }], "0.name");
// => throws InvalidArgumentException
```

```js [@tolki/obj]
import { boolean } from "@tolki/obj";

boolean({ available: true }, "available");
// => true

boolean({ name: "Joe" }, "name");
// => throws InvalidArgumentException
```

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

:::

<FnTry label="dataBoolean" :fn="dataBoolean" :args="[
  { name: 'data', type: 'json', default: { available: true } },
  { name: 'key', default: 'available' },
]" />

### chunk

Break an array or object into chunks of the given size.

Exported as `chunk` from `@tolki/arr` and `@tolki/obj`, and as `dataChunk` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { chunk } from "@tolki/arr";

chunk([1, 2, 3, 4, 5], 2);
// => [[1, 2], [3, 4], [5]]
```

```js [@tolki/obj]
import { chunk } from "@tolki/obj";

chunk({ a: 1, b: 2, c: 3 }, 2);
// => { 0: { a: 1, b: 2 }, 1: { c: 3 } }

// Pass false as the third argument to number the entries in each chunk instead of keeping their keys.
chunk({ a: 1, b: 2, c: 3 }, 2, false);
// => { 0: { 0: 1, 1: 2 }, 1: { 0: 3 } }
```

```js [@tolki/data]
import { dataChunk } from "@tolki/data";

dataChunk([1, 2, 3, 4, 5], 2);
// => [[1, 2], [3, 4], [5]]

dataChunk({ a: 1, b: 2, c: 3 }, 2);
// => { 0: { a: 1, b: 2 }, 1: { c: 3 } }
```

:::

<FnTry label="dataChunk" :fn="dataChunk" :args="[
  { name: 'data', type: 'json', default: [1, 2, 3, 4, 5] },
  { name: 'size', type: 'number', default: 2 },
]" />

### chunkBy

Break into chunks by comparing adjacent values, using a key path or a callback.

Exported as `chunkBy` from `@tolki/arr` and `@tolki/obj`, and as `dataChunkBy` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { chunkBy } from "@tolki/arr";

chunkBy([1, 1, 2, 2, 1], (value) => value);
// => [[1, 1], [2, 2], [1]]

chunkBy([{ type: "a" }, { type: "a" }, { type: "b" }], "type");
// => [[{ type: "a" }, { type: "a" }], [{ type: "b" }]]
```

```js [@tolki/obj]
import { chunkBy } from "@tolki/obj";

chunkBy({ a: 1, b: 1, c: 2 }, (value) => value);
// => { 0: { a: 1, b: 1 }, 1: { c: 2 } }
```

```js [@tolki/data]
import { dataChunkBy } from "@tolki/data";

dataChunkBy([1, 1, 2], (value) => value);
// => [[1, 1], [2]]

dataChunkBy({ a: 1, b: 1, c: 2 }, (value) => value);
// => { 0: { a: 1, b: 1 }, 1: { c: 2 } }
```

:::

<FnTry label="dataChunkBy" :fn="dataChunkBy" :args="[
  { name: 'data', type: 'json', default: [1, 1, 2, 2, 1] },
  { name: 'key', type: 'select', default: chunkByCallbacks[0].value, options: chunkByCallbacks },
]" />

### chunkWhile

Break into chunks with a callback that decides whether the next value joins the current chunk. It receives the value, its key and the chunk built so far.

Exported as `chunkWhile` from `@tolki/arr` and `@tolki/obj`, and as `dataChunkWhile` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { chunkWhile } from "@tolki/arr";

chunkWhile(["A", "A", "B"], (value, index, chunk) => chunk.at(-1) === value);
// => [["A", "A"], ["B"]]
```

```js [@tolki/obj]
import { chunkWhile } from "@tolki/obj";

chunkWhile(
  { a: 1, b: 1, c: 2 },
  (value, key, chunk) => Object.values(chunk).at(-1) === value,
);
// => { 0: { a: 1, b: 1 }, 1: { c: 2 } }
```

```js [@tolki/data]
import { dataChunkWhile } from "@tolki/data";

dataChunkWhile([1, 1, 2], (value, index, chunk) => chunk.at(-1) === value);
// => [[1, 1], [2]]
```

:::

<FnTry label="dataChunkWhile" :fn="dataChunkWhile" :args="[
  { name: 'data', type: 'json', default: [1, 1, 2, 3, 3] },
  { name: 'callback', type: 'select', default: chunkWhileCallbacks[0].value, options: chunkWhileCallbacks },
]" />

### collapse

Collapse an array of arrays into a single array, or an object of objects into a single object.

Exported as `collapse` from `@tolki/arr` and `@tolki/obj`, and as `dataCollapse` from `@tolki/data`.

Laravel: [`Arr::collapse()`](https://laravel.com/docs/helpers#method-array-collapse)

::: code-group

```js [@tolki/arr]
import { collapse } from "@tolki/arr";

collapse([
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
]);
// => [1, 2, 3, 4, 5, 6, 7, 8, 9]

collapse([{ a: 1, b: 2 }, { c: 3 }]);
// => { a: 1, b: 2, c: 3 }
```

```js [@tolki/obj]
import { collapse } from "@tolki/obj";

collapse({ a: { x: 1 }, b: { y: 2 } });
// => { x: 1, y: 2 }
```

```js [@tolki/data]
import { dataCollapse } from "@tolki/data";

dataCollapse([[1, 2], [3]]);
// => [1, 2, 3]

dataCollapse({ a: { x: 1 }, b: { y: 2 } });
// => { x: 1, y: 2 }
```

:::

<FnTry label="dataCollapse" :fn="dataCollapse" :args="[
  { name: 'data', type: 'json', default: [[1, 2], [3, 4]] },
]" />

### combine

Combine two sets: the values of the first become the keys and the values of the second become the values. Both must hold the same number of items.

Exported as `combine` from `@tolki/arr` and `@tolki/obj`, and as `dataCombine` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { combine } from "@tolki/arr";

combine(["name", "price"], ["Desk", 100]);
// => { name: "Desk", price: 100 }
```

```js [@tolki/obj]
import { combine } from "@tolki/obj";

combine({ first: "name", second: "price" }, { x: "Desk", y: 100 });
// => { name: "Desk", price: 100 }
```

```js [@tolki/data]
import { dataCombine } from "@tolki/data";

dataCombine(["name", "price"], ["Desk", 100]);
// => { name: "Desk", price: 100 }
```

:::

<FnTry label="dataCombine" :fn="dataCombine" :args="[
  { name: 'itemsA', type: 'json', default: ['name', 'price'] },
  { name: 'itemsB', type: 'json', default: ['Desk', 100] },
]" />

### contains

Determine if there is a given value, a matching item or a matching key path. The comparison is loose, so `"1"` matches `1`; see [PHP Semantics](./php-semantics.md#loose-and-strict-comparison).

Exported as `contains` from `@tolki/arr` and `@tolki/obj`, and as `dataContains` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { contains } from "@tolki/arr";

contains([1, 2, 3], 2);
// => true

contains(["1"], 1);
// => true

contains([1, 2, 3], (value) => value > 2);
// => true

contains([{ age: 30 }], "age", ">", 25);
// => true
```

```js [@tolki/obj]
import { contains } from "@tolki/obj";

contains({ a: 1, b: 2 }, 2);
// => true

contains({ a: 1, b: 2 }, (value) => value > 2);
// => false

contains({ a: { age: 30 } }, "age", ">", 25);
// => true
```

```js [@tolki/data]
import { dataContains } from "@tolki/data";

dataContains([1, 2, 3], 2);
// => true

dataContains({ a: 1, b: 2 }, (value) => value > 1);
// => true
```

:::

<FnTry label="dataContains" :fn="dataContains" :args="[
  { name: 'data', type: 'json', default: [1, 2, 3] },
  { name: 'value', type: 'json', default: 2 },
]" />

### containsStrict

Determine if there is a given value, compared strictly, so `"02"` does not match `2`.

Exported as `containsStrict` from `@tolki/arr` and `@tolki/obj`, and as `dataContainsStrict` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { containsStrict } from "@tolki/arr";

containsStrict([1, 3, 5, "02"], "02");
// => true

containsStrict([1, 3, 5, "02"], 2);
// => false
```

```js [@tolki/obj]
import { containsStrict } from "@tolki/obj";

containsStrict({ a: 1, b: "02" }, "02");
// => true

containsStrict({ a: 1, b: "02" }, 2);
// => false
```

```js [@tolki/data]
import { dataContainsStrict } from "@tolki/data";

dataContainsStrict([1, 3, 5, "02"], 2);
// => false

dataContainsStrict([{ user: { id: 2 } }], "user.id", 2);
// => true
```

:::

<FnTry label="dataContainsStrict" :fn="dataContainsStrict" :args="[
  { name: 'data', type: 'json', default: [1, 3, 5, '02'] },
  { name: 'key', type: 'json', default: 2 },
]" />

### count

Count the number of items in an array, an object or a `Map`.

Exported as `dataCount` from `@tolki/data`.

::: code-group

```js [@tolki/data]
import { dataCount } from "@tolki/data";

dataCount([1, 2, 3]);
// => 3

dataCount({ a: 1, b: 2 });
// => 2
```

:::

<FnTry label="dataCount" :fn="dataCount" :args="[
  { name: 'data', type: 'json', default: [1, 2, 3] },
]" />

### crossJoin

Cross join the given sets, returning every possible combination.

Exported as `crossJoin` from `@tolki/arr` and `@tolki/obj`, and as `dataCrossJoin` from `@tolki/data`.

Laravel: [`Arr::crossJoin()`](https://laravel.com/docs/helpers#method-array-crossjoin)

::: code-group

```js [@tolki/arr]
import { crossJoin } from "@tolki/arr";

crossJoin([1, 2], ["a", "b"]);
// => [[1, "a"], [1, "b"], [2, "a"], [2, "b"]]
```

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

```js [@tolki/data]
import { dataCrossJoin } from "@tolki/data";

dataCrossJoin([1, 2], ["a", "b"]);
// => [[1, "a"], [1, "b"], [2, "a"], [2, "b"]]
```

:::

<FnTry label="dataCrossJoin" :fn="dataCrossJoin" :args="[
  { name: 'data', type: 'json', default: [1, 2] },
  { name: 'others', type: 'json', default: ['a', 'b'] },
]" />

### diff

Get the items whose values are not present in the other set.

Exported as `diff` from `@tolki/arr` and `@tolki/obj`, and as `dataDiff` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { diff } from "@tolki/arr";

diff([1, 2, 3, 4], [2, 4]);
// => [1, 3]
```

```js [@tolki/obj]
import { diff } from "@tolki/obj";

diff({ a: 1, b: 2, c: 3 }, { x: 2 });
// => { a: 1, c: 3 }
```

```js [@tolki/data]
import { dataDiff } from "@tolki/data";

dataDiff([1, 2, 3, 4], [2, 4]);
// => [1, 3]

dataDiff({ a: 1, b: 2, c: 3 }, { x: 2 });
// => { a: 1, c: 3 }
```

:::

<FnTry label="dataDiff" :fn="dataDiff" :args="[
  { name: 'data', type: 'json', default: [1, 2, 3, 4] },
  { name: 'other', type: 'json', default: [2, 4] },
]" />

### diffAssoc

Get the items whose key and value are not both present in the other set.

Exported as `diffAssoc` from `@tolki/arr` and `@tolki/obj`, and as `dataDiffAssoc` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { diffAssoc } from "@tolki/arr";

diffAssoc([1, 2, 3], [1, 9, 3]);
// => [2]
```

```js [@tolki/obj]
import { diffAssoc } from "@tolki/obj";

diffAssoc(
  { color: "orange", type: "fruit", remain: 6 },
  { color: "yellow", type: "fruit", remain: 3 },
);
// => { color: "orange", remain: 6 }
```

```js [@tolki/data]
import { dataDiffAssoc } from "@tolki/data";

dataDiffAssoc({ a: 1, b: 2, c: 3 }, { b: 2 });
// => { a: 1, c: 3 }
```

:::

<FnTry label="dataDiffAssoc" :fn="dataDiffAssoc" :args="[
  { name: 'data', type: 'json', default: { a: 1, b: 2, c: 3 } },
  { name: 'other', type: 'json', default: { b: 2 } },
]" />

### diffAssocUsing

Get the items whose key and value are not both present in the other set, using a callback to say whether two keys match.

Exported as `diffAssocUsing` from `@tolki/arr` and `@tolki/obj`, and as `dataDiffAssocUsing` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { diffAssocUsing } from "@tolki/arr";

const same = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();

diffAssocUsing([1, 2, 3], [1, 9, 3], same);
// => [2]
```

```js [@tolki/obj]
import { diffAssocUsing } from "@tolki/obj";

const same = (a, b) => a.toLowerCase() === b.toLowerCase();

diffAssocUsing({ a: "green", b: "brown" }, { A: "green", c: "blue" }, same);
// => { b: "brown" }
```

```js [@tolki/data]
import { dataDiffAssocUsing } from "@tolki/data";

const same = (a, b) => a.toLowerCase() === b.toLowerCase();

dataDiffAssocUsing({ a: "green", b: "brown" }, { A: "green", c: "blue" }, same);
// => { b: "brown" }
```

:::

<FnTry label="dataDiffAssocUsing" :fn="dataDiffAssocUsing" :args="[
  { name: 'data', type: 'json', default: { a: 'green', b: 'brown' } },
  { name: 'other', type: 'json', default: { A: 'green', c: 'blue' } },
  { name: 'callback', type: 'select', default: keyComparators[0].value, options: keyComparators },
]" />

### diffKeys

Get the items whose key is not present in the other set. Values are ignored.

Exported as `diffKeys` from `@tolki/arr` and `@tolki/obj`, and as `dataDiffKeys` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { diffKeys } from "@tolki/arr";

diffKeys([1, 2, 3], [9, 9]);
// => [3]
```

```js [@tolki/obj]
import { diffKeys } from "@tolki/obj";

diffKeys({ id: 1, first_word: "Hello" }, { id: 123, foo_bar: "Hello" });
// => { first_word: "Hello" }
```

```js [@tolki/data]
import { dataDiffKeys } from "@tolki/data";

dataDiffKeys([1, 2, 3], [9, 9]);
// => [3]

dataDiffKeys({ id: 1, first_word: "Hello" }, { id: 123, foo_bar: "Hello" });
// => { first_word: "Hello" }
```

:::

<FnTry label="dataDiffKeys" :fn="dataDiffKeys" :args="[
  { name: 'data', type: 'json', default: { id: 1, first_word: 'Hello' } },
  { name: 'other', type: 'json', default: { id: 123, foo_bar: 'Hello' } },
]" />

### diffKeysUsing

Get the items whose key is not present in the other set, using a callback to say whether two keys match. Values are ignored.

Exported as `diffKeysUsing` from `@tolki/arr` and `@tolki/obj`, and as `dataDiffKeysUsing` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { diffKeysUsing } from "@tolki/arr";

const same = (a, b) => String(a) === String(b);

diffKeysUsing([1, 2], { a: 1, 1: 5 }, same);
// => [1]
```

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

:::

<FnTry label="dataDiffKeysUsing" :fn="dataDiffKeysUsing" :args="[
  { name: 'data', type: 'json', default: { id: 1, first_word: 'Hello' } },
  { name: 'other', type: 'json', default: { ID: 123, foo_bar: 'Hello' } },
  { name: 'callback', type: 'select', default: keyComparators[0].value, options: keyComparators },
]" />

### diffUsing

Get the items whose values are not present in the other set, using a callback to say whether two values are equal.

Exported as `diffUsing` from `@tolki/arr` and `@tolki/obj`, and as `dataDiffUsing` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { diffUsing } from "@tolki/arr";

const same = (a, b) => a.toLowerCase() === b.toLowerCase();

diffUsing(["Green", "Brown", "Blue"], ["GREEN", "Yellow"], same);
// => ["Brown", "Blue"]
```

```js [@tolki/obj]
import { diffUsing } from "@tolki/obj";

const same = (a, b) => a.toLowerCase() === b.toLowerCase();

diffUsing({ a: "Green", b: "Brown" }, { x: "GREEN" }, same);
// => { b: "Brown" }
```

```js [@tolki/data]
import { dataDiffUsing } from "@tolki/data";

const same = (a, b) => a.toLowerCase() === b.toLowerCase();

dataDiffUsing(["Green", "Brown", "Blue"], ["GREEN", "Yellow"], same);
// => ["Brown", "Blue"]
```

:::

<FnTry label="dataDiffUsing" :fn="dataDiffUsing" :args="[
  { name: 'data', type: 'json', default: ['Green', 'Brown', 'Blue'] },
  { name: 'other', type: 'json', default: ['GREEN', 'Yellow'] },
  { name: 'callback', type: 'select', default: keyComparators[0].value, options: keyComparators },
]" />

### divide

Divide into two lists: one with the keys and the other with the values.

Exported as `divide` from `@tolki/arr` and `@tolki/obj`, and as `dataDivide` from `@tolki/data`.

Laravel: [`Arr::divide()`](https://laravel.com/docs/helpers#method-array-divide)

::: code-group

```js [@tolki/arr]
import { divide } from "@tolki/arr";

divide(["Desk", 100]);
// => [[0, 1], ["Desk", 100]]
```

```js [@tolki/obj]
import { divide } from "@tolki/obj";

divide({ name: "Desk", price: 100 });
// => [["name", "price"], ["Desk", 100]]
```

```js [@tolki/data]
import { dataDivide } from "@tolki/data";

dataDivide(["Desk", 100]);
// => [[0, 1], ["Desk", 100]]

dataDivide({ name: "Desk", price: 100 });
// => [["name", "price"], ["Desk", 100]]
```

:::

<FnTry label="dataDivide" :fn="dataDivide" :args="[
  { name: 'data', type: 'json', default: { name: 'Desk', price: 100 } },
]" />

### dot

Flatten a multi-dimensional array or object into a single level that uses "dot" notation to show depth. See [Dot Notation](./dot-notation.md).

Exported as `dot` from `@tolki/arr` and `@tolki/obj`, and as `dataDot` from `@tolki/data`.

Laravel: [`Arr::dot()`](https://laravel.com/docs/helpers#method-array-dot)

::: code-group

```js [@tolki/arr]
import { dot } from "@tolki/arr";

dot(["a", ["b", "c"]]);
// => { 0: "a", "1.0": "b", "1.1": "c" }
```

```js [@tolki/obj]
import { dot } from "@tolki/obj";

dot({ products: { desk: { price: 100 } } });
// => { "products.desk.price": 100 }
```

```js [@tolki/data]
import { dataDot } from "@tolki/data";

dataDot({ products: { desk: { price: 100 } } });
// => { "products.desk.price": 100 }

dataDot(["a", ["b", "c"]]);
// => { 0: "a", "1.0": "b", "1.1": "c" }
```

:::

<FnTry label="dataDot" :fn="dataDot" :args="[
  { name: 'data', type: 'json', default: { products: { desk: { price: 100 } } } },
]" />

### every

Determine if all items pass the given truth test.

Exported as `every` from `@tolki/arr` and `@tolki/obj`, and as `dataEvery` from `@tolki/data`.

Laravel: [`Arr::every()`](https://laravel.com/docs/helpers#method-array-every)

::: code-group

```js [@tolki/arr]
import { every } from "@tolki/arr";

every([1, 2, 3], (value) => value > 0);
// => true

every([1, 2, 3], (value) => value > 2);
// => false
```

```js [@tolki/obj]
import { every } from "@tolki/obj";

every({ a: 1, b: 2 }, (value) => value > 0);
// => true

every({ a: 1, b: 2 }, (value) => value > 1);
// => false
```

```js [@tolki/data]
import { dataEvery } from "@tolki/data";

dataEvery([1, 2, 3], (value) => value > 0);
// => true

dataEvery({ a: 1, b: 2 }, (value) => value > 1);
// => false
```

:::

<FnTry label="dataEvery" :fn="dataEvery" :args="[
  { name: 'data', type: 'json', default: [1, 2, 3] },
  { name: 'callback', type: 'select', default: predicates[0].value, options: predicates },
]" />

### except

Get all of the given array or object except for a specified list of keys.

Exported as `except` from `@tolki/arr` and `@tolki/obj`, and as `dataExcept` from `@tolki/data`.

Laravel: [`Arr::except()`](https://laravel.com/docs/helpers#method-array-except)

::: code-group

```js [@tolki/arr]
import { except } from "@tolki/arr";

except(["a", "b", "c"], 1);
// => ["a", "c"]

except(["a", "b", "c"], [0, 2]);
// => ["b"]
```

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

```js [@tolki/data]
import { dataExcept } from "@tolki/data";

dataExcept(["a", "b", "c"], 1);
// => ["a", "c"]

dataExcept({ name: "Desk", price: 100 }, "price");
// => { name: "Desk" }
```

:::

<FnTry label="dataExcept" :fn="dataExcept" :args="[
  { name: 'data', type: 'json', default: { name: 'Desk', price: 100 } },
  { name: 'keys', type: 'json', default: 'price' },
]" />

### exceptValues

Get all of the given array or object except for a specified list of values. Values match loosely, unless `strict` is `true`.

Exported as `exceptValues` from `@tolki/arr` and `@tolki/obj`, and as `dataExceptValues` from `@tolki/data`.

Laravel: [`Arr::exceptValues()`](https://laravel.com/docs/helpers#method-array-except-values)

::: code-group

```js [@tolki/arr]
import { exceptValues } from "@tolki/arr";

exceptValues([1, 2, 3, 2], 2);
// => [1, 3]

exceptValues([1, "1", 0, false], [1]);
// => [0, false]

exceptValues([1, "1", 0, false], [1], true);
// => ["1", 0, false]
```

```js [@tolki/obj]
import { exceptValues } from "@tolki/obj";

exceptValues({ a: 1, b: 2, c: 1, d: 3 }, 1);
// => { b: 2, d: 3 }

exceptValues({ a: true, b: false, c: 1, d: 0 }, [1, 0], true);
// => { a: true, b: false }
```

```js [@tolki/data]
import { dataExceptValues } from "@tolki/data";

dataExceptValues([1, 2, 3, 2], 2);
// => [1, 3]

dataExceptValues({ a: 1, b: 2, c: 1 }, 1);
// => { b: 2 }
```

:::

<FnTry label="dataExceptValues" :fn="dataExceptValues" :args="[
  { name: 'data', type: 'json', default: { a: 1, b: 2, c: 1, d: 3 } },
  { name: 'values', type: 'json', default: [1] },
  { name: 'strict', type: 'boolean', default: false },
]" />

### exists

Determine if the given key exists in the provided array or object. A key set to `null` still exists.

Exported as `exists` from `@tolki/arr` and `@tolki/obj`, and as `dataExists` from `@tolki/data`.

Laravel: [`Arr::exists()`](https://laravel.com/docs/helpers#method-array-exists)

::: code-group

```js [@tolki/arr]
import { exists } from "@tolki/arr";

exists(["a", "b"], 1);
// => true

exists(["a", "b"], 5);
// => false
```

```js [@tolki/obj]
import { exists } from "@tolki/obj";

exists({ name: "Desk", price: null }, "price");
// => true

exists({ name: "Desk" }, "sku");
// => false
```

```js [@tolki/data]
import { dataExists } from "@tolki/data";

dataExists(["a", "b"], 1);
// => true

dataExists({ name: "Desk" }, "sku");
// => false
```

:::

<FnTry label="dataExists" :fn="dataExists" :args="[
  { name: 'data', type: 'json', default: { name: 'Desk', price: null } },
  { name: 'key', default: 'price' },
]" />

### filter

Filter the array or object using a callback. Without a callback, it removes the items that PHP treats as empty. See [Truthiness](./php-semantics.md#truthiness).

Exported as `filter` from `@tolki/arr` and `@tolki/obj`, and as `dataFilter` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { filter } from "@tolki/arr";

filter([1, 2, 3, 4], (value) => value > 2);
// => [3, 4]

filter([0, 1, "", null, "a"]);
// => [1, "a"]
```

```js [@tolki/obj]
import { filter } from "@tolki/obj";

filter({ a: 1, b: 2, c: 3, d: 4 }, (value) => value > 2);
// => { c: 3, d: 4 }

filter({ a: "0", b: "", c: 0, d: "x" });
// => { d: "x" }
```

```js [@tolki/data]
import { dataFilter } from "@tolki/data";

dataFilter([1, 2, 3, 4], (value) => value > 2);
// => [3, 4]

dataFilter({ a: 1, b: 2, c: 3 }, (value) => value > 1);
// => { b: 2, c: 3 }
```

:::

<FnTry label="dataFilter" :fn="dataFilter" :args="[
  { name: 'data', type: 'json', default: { a: 1, b: 2, c: 3, d: 4 } },
  { name: 'callback', type: 'select', default: predicates[0].value, options: predicates },
]" />

### first

Get the first item, or the first item that passes a truth test. When nothing is found, it returns the default value, or `null`.

Exported as `first` from `@tolki/arr` and `@tolki/obj`, and as `dataFirst` from `@tolki/data`.

Laravel: [`Arr::first()`](https://laravel.com/docs/helpers#method-array-first)

::: code-group

```js [@tolki/arr]
import { first } from "@tolki/arr";

first([100, 200, 300]);
// => 100

first([100, 200, 300], (value) => value >= 150);
// => 200

first([100, 200, 300], (value) => value > 500, "none");
// => "none"
```

```js [@tolki/obj]
import { first } from "@tolki/obj";

first({ a: 1, b: 2, c: 3 });
// => 1

first({ a: 1, b: 2, c: 3 }, (value) => value > 1);
// => 2

first({}, null, "none");
// => "none"
```

```js [@tolki/data]
import { dataFirst } from "@tolki/data";

dataFirst([1, 2, 3, 4], (value) => value > 2);
// => 3

dataFirst({ a: 1, b: 2, c: 3 }, (value) => value > 1);
// => 2

dataFirst([], null, "none");
// => "none"
```

:::

<FnTry label="dataFirst" :fn="dataFirst" :args="[
  { name: 'data', type: 'json', default: { a: 1, b: 2, c: 3 } },
  { name: 'callback', type: 'select', default: predicates[0].value, options: predicates },
]" />

### flatten

Flatten a multi-dimensional array or object into a single-level array of its values. The depth argument limits how many levels to flatten.

Exported as `flatten` from `@tolki/arr` and `@tolki/obj`, and as `dataFlatten` from `@tolki/data`.

Laravel: [`Arr::flatten()`](https://laravel.com/docs/helpers#method-array-flatten)

::: code-group

```js [@tolki/arr]
import { flatten } from "@tolki/arr";

flatten(["Joe", ["PHP", "Ruby"]]);
// => ["Joe", "PHP", "Ruby"]

flatten([1, [2, [3, [4]]]], 1);
// => [1, 2, [3, [4]]]
```

```js [@tolki/obj]
import { flatten } from "@tolki/obj";

flatten({ a: 1, b: { c: 2, d: { e: 3 } } });
// => [1, 2, 3]

flatten({ a: 1, b: { c: 2, d: { e: 3 } } }, 1);
// => [1, 2, { e: 3 }]
```

```js [@tolki/data]
import { dataFlatten } from "@tolki/data";

dataFlatten([1, [2, [3]]]);
// => [1, 2, 3]

dataFlatten({ a: 1, b: { c: 2 } });
// => [1, 2]
```

:::

<FnTry label="dataFlatten" :fn="dataFlatten" :args="[
  { name: 'data', type: 'json', default: { a: 1, b: { c: 2, d: { e: 3 } } } },
]" />

### flattenDot

Flatten a multi-dimensional object into one level of "dot" notation keys, stopping at the given depth. See [Dot Notation](./dot-notation.md).

Exported as `flattenDot` from `@tolki/obj`.

::: code-group

```js [@tolki/obj]
import { flattenDot } from "@tolki/obj";

flattenDot({ users: { john: { name: "John", tags: ["a"] } } });
// => { "users.john.name": "John", "users.john.tags.0": "a" }

flattenDot({ users: { john: { name: "John" } } }, 1);
// => { "users.john": { name: "John" } }
```

:::

<!-- docs/php-parity/Arr/dot.json, "dot-empty-leaf", "dot-nested-empty-leaf" -->

::: info
`flattenDot` drops an empty nested object or array, where Laravel's `Arr::dot()` keeps it as a value. Use [`dot`](#dot) to keep it. See [Behaviour differences](./differences.md#behaviour-differences).
:::

<FnTry label="flattenDot" :fn="flattenDot" :args="[
  { name: 'data', type: 'json', default: { users: { john: { name: 'John' } } } },
  { name: 'depth', type: 'number', default: 1 },
]" />

### flip

Flip the keys and the values: each value becomes a key, and each key becomes its value.

Exported as `flip` from `@tolki/arr` and `@tolki/obj`, and as `dataFlip` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { flip } from "@tolki/arr";

flip(["a", "b", "c"]);
// => { a: 0, b: 1, c: 2 }
```

```js [@tolki/obj]
import { flip } from "@tolki/obj";

flip({ name: "taylor", role: "admin" });
// => { taylor: "name", admin: "role" }
```

```js [@tolki/data]
import { dataFlip } from "@tolki/data";

dataFlip(["a", "b", "c"]);
// => { a: 0, b: 1, c: 2 }

dataFlip({ name: "taylor" });
// => { taylor: "name" }
```

:::

<FnTry label="dataFlip" :fn="dataFlip" :args="[
  { name: 'data', type: 'json', default: { name: 'taylor', role: 'admin' } },
]" />

### float

Get a float item using "dot" notation, throwing an `InvalidArgumentException` if the value is not a number.

Exported as `float` from `@tolki/arr` and `@tolki/obj`, and as `dataFloat` from `@tolki/data`.

Laravel: [`Arr::float()`](https://laravel.com/docs/helpers#method-array-float)

::: code-group

```js [@tolki/arr]
import { float } from "@tolki/arr";

float([{ price: 19.99 }], "0.price");
// => 19.99

float([{ price: 19.99 }], "0.discount", 1.5);
// => 1.5

float([{ name: "Widget" }], "0.name");
// => throws InvalidArgumentException
```

```js [@tolki/obj]
import { float } from "@tolki/obj";

float({ product: { price: 19.99 } }, "product.price");
// => 19.99

float({ product: { name: "Widget" } }, "product.name");
// => throws InvalidArgumentException
```

```js [@tolki/data]
import { dataFloat } from "@tolki/data";

dataFloat({ product: { price: 19.99 } }, "product.price");
// => 19.99

dataFloat([{ price: 19.99 }], "0.price");
// => 19.99
```

:::

<!-- docs/php-parity/Arr/float.json, "Arr::float rejects a whole-number int" -->

::: info
`float` accepts a whole number such as `1`, where Laravel's `Arr::float()` throws, because PHP's `is_float()` rejects an integer. JavaScript has one number type. See [Behaviour differences](./differences.md#behaviour-differences).
:::

<FnTry label="dataFloat" :fn="dataFloat" :args="[
  { name: 'data', type: 'json', default: { product: { price: 19.99 } } },
  { name: 'key', default: 'product.price' },
]" />

### forget

Remove one or many items from an array or object using "dot" notation. It returns a new value and leaves the original unchanged. See [Return values instead of references](./differences.md#return-values-instead-of-references).

Exported as `forget` from `@tolki/arr` and `@tolki/obj`, and as `dataForget` from `@tolki/data`.

Laravel: [`Arr::forget()`](https://laravel.com/docs/helpers#method-array-forget) · [`data_forget()`](https://laravel.com/docs/helpers#method-data-forget)

::: code-group

```js [@tolki/arr]
import { forget } from "@tolki/arr";

forget([["a", "b"], ["c"]], "0.1");
// => [["a"], ["c"]]

forget(["a", "b", "c"], [0, 2]);
// => ["b"]
```

```js [@tolki/obj]
import { forget } from "@tolki/obj";

forget({ user: { name: "John", age: 30 } }, "user.age");
// => { user: { name: "John" } }

forget({ name: "John", age: 30, city: "NYC" }, ["age", "city"]);
// => { name: "John" }
```

```js [@tolki/data]
import { dataForget } from "@tolki/data";

dataForget({ user: { name: "John", age: 30 } }, "user.age");
// => { user: { name: "John" } }

dataForget(["a", "b", "c"], 1);
// => ["a", "c"]
```

:::

<FnTry label="dataForget" :fn="dataForget" :args="[
  { name: 'data', type: 'json', default: { user: { name: 'John', age: 30 } } },
  { name: 'keys', default: 'user.age' },
]" />

### from

Get the underlying array or object of items from the given argument: a list stays a list, and a `Map` becomes an object. A scalar throws an `InvalidArgumentException`.

Exported as `from` from `@tolki/arr` and `@tolki/obj`, and as `dataFrom` from `@tolki/data`.

Laravel: [`Arr::from()`](https://laravel.com/docs/helpers#method-array-from)

::: code-group

```js [@tolki/arr]
import { from } from "@tolki/arr";

from([1, 2]);
// => [1, 2]

from(new Map([["foo", "bar"]]));
// => { foo: "bar" }

from(1);
// => throws InvalidArgumentException
```

```js [@tolki/obj]
import { from } from "@tolki/obj";

from({ foo: "bar" });
// => { foo: "bar" }

from(new Map([["foo", "bar"]]));
// => { foo: "bar" }

from(1);
// => throws InvalidArgumentException
```

```js [@tolki/data]
import { dataFrom } from "@tolki/data";

dataFrom([1, 2]);
// => [1, 2]

dataFrom(new Map([["foo", "bar"]]));
// => { foo: "bar" }
```

:::

<FnTry label="dataFrom" :fn="dataFrom" :args="[
  { name: 'items', type: 'json', default: { foo: 'bar' } },
]" />

### get

Get an item from an array or object using "dot" notation. A missing path returns the default value, or `null`. See [Dot Notation](./dot-notation.md).

Exported as `get` from `@tolki/arr` and `@tolki/obj`, and as `dataGet` from `@tolki/data`.

Laravel: [`Arr::get()`](https://laravel.com/docs/helpers#method-array-get) · [`data_get()`](https://laravel.com/docs/helpers#method-data-get)

::: code-group

```js [@tolki/arr]
import { get } from "@tolki/arr";

get([{ price: 100 }], "0.price");
// => 100

get([{ price: 100 }], "0.discount", 0);
// => 0
```

```js [@tolki/obj]
import { get } from "@tolki/obj";

get({ desk: { price: 100 } }, "desk.price");
// => 100

get({ desk: { price: 100 } }, "desk.discount", 0);
// => 0
```

```js [@tolki/data]
import { dataGet } from "@tolki/data";

dataGet([{ price: 100 }], "0.price");
// => 100

dataGet({ desk: { price: 100 } }, "desk.price");
// => 100

dataGet({ desk: { price: 100 } }, "desk.discount");
// => null
```

:::

<FnTry label="dataGet" :fn="dataGet" :args="[
  { name: 'data', type: 'json', default: { desk: { price: 100 } } },
  { name: 'key', default: 'desk.price' },
]" />

### has

Determine if an item or items exist in an array or object using "dot" notation. A key set to `null` still exists. When given several keys, all of them must exist. See [Dot Notation](./dot-notation.md).

Exported as `has` from `@tolki/arr` and `@tolki/obj`, and as `dataHas` from `@tolki/data`.

Laravel: [`Arr::has()`](https://laravel.com/docs/helpers#method-array-has)

::: code-group

```js [@tolki/arr]
import { has } from "@tolki/arr";

has([["a"], ["b"]], "0.0");
// => true

has([["a"], ["b"]], ["0.0", "1.1"]);
// => false
```

```js [@tolki/obj]
import { has } from "@tolki/obj";

has({ name: "John", address: { city: "NYC" } }, "address.city");
// => true

has({ name: "John", address: { city: "NYC" } }, ["name", "address.country"]);
// => false

has({ price: null }, "price");
// => true
```

```js [@tolki/data]
import { dataHas } from "@tolki/data";

dataHas([["a"], ["b"]], "0.0");
// => true

dataHas({ name: "John", address: { city: "NYC" } }, ["name", "address.city"]);
// => true
```

:::

<FnTry label="dataHas" :fn="dataHas" :args="[
  { name: 'data', type: 'json', default: { name: 'John', address: { city: 'NYC' } } },
  { name: 'keys', type: 'json', default: ['name', 'address.city'] },
]" />

### hasAll

Determine if all keys exist in an array or object using "dot" notation. See [Dot Notation](./dot-notation.md).

Exported as `hasAll` from `@tolki/arr` and `@tolki/obj`, and as `dataHasAll` from `@tolki/data`.

Laravel: [`Arr::hasAll()`](https://laravel.com/docs/helpers#method-array-hasall)

::: code-group

```js [@tolki/arr]
import { hasAll } from "@tolki/arr";

hasAll([["a"], ["b"]], ["0.0", "1.0"]);
// => true

hasAll([["a"], ["b"]], ["0.0", "1.1"]);
// => false
```

```js [@tolki/obj]
import { hasAll } from "@tolki/obj";

hasAll({ name: "John", address: { city: "NYC" } }, ["name", "address.city"]);
// => true

hasAll({ name: "John", address: { city: "NYC" } }, ["name", "address.country"]);
// => false
```

```js [@tolki/data]
import { dataHasAll } from "@tolki/data";

dataHasAll([["a"], ["b"]], ["0.0", "1.0"]);
// => true

dataHasAll({ name: "John" }, ["name", "email"]);
// => false
```

:::

<FnTry label="dataHasAll" :fn="dataHasAll" :args="[
  { name: 'data', type: 'json', default: { name: 'John', address: { city: 'NYC' } } },
  { name: 'keys', type: 'json', default: ['name', 'address.city'] },
]" />

### hasAny

Determine if any of the keys exist in an array or object using "dot" notation. See [Dot Notation](./dot-notation.md).

Exported as `hasAny` from `@tolki/arr` and `@tolki/obj`, and as `dataHasAny` from `@tolki/data`.

Laravel: [`Arr::hasAny()`](https://laravel.com/docs/helpers#method-array-hasany)

::: code-group

```js [@tolki/arr]
import { hasAny } from "@tolki/arr";

hasAny([["a"], ["b"]], ["0.5", "1.0"]);
// => true

hasAny([["a"], ["b"]], ["0.5", "3"]);
// => false
```

```js [@tolki/obj]
import { hasAny } from "@tolki/obj";

hasAny({ name: "John", address: { city: "NYC" } }, ["email", "name"]);
// => true

hasAny({ name: "John", address: { city: "NYC" } }, ["email", "phone"]);
// => false
```

```js [@tolki/data]
import { dataHasAny } from "@tolki/data";

dataHasAny([["a"], ["b"]], ["0.5", "1.0"]);
// => true

dataHasAny({ name: "John" }, ["email", "phone"]);
// => false
```

:::

<FnTry label="dataHasAny" :fn="dataHasAny" :args="[
  { name: 'data', type: 'json', default: { name: 'John', address: { city: 'NYC' } } },
  { name: 'keys', type: 'json', default: ['email', 'name'] },
]" />

### integer

Get an integer item using "dot" notation, throwing an `InvalidArgumentException` if the value is not an integer.

Exported as `integer` from `@tolki/arr` and `@tolki/obj`, and as `dataInteger` from `@tolki/data`.

Laravel: [`Arr::integer()`](https://laravel.com/docs/helpers#method-array-integer)

::: code-group

```js [@tolki/arr]
import { integer } from "@tolki/arr";

integer([{ age: 30 }], "0.age");
// => 30

integer([{ age: 30 }], "0.score", 7);
// => 7

integer([{ age: 30.5 }], "0.age");
// => throws InvalidArgumentException
```

```js [@tolki/obj]
import { integer } from "@tolki/obj";

integer({ user: { age: 30 } }, "user.age");
// => 30

integer({ user: { name: "John" } }, "user.name");
// => throws InvalidArgumentException
```

```js [@tolki/data]
import { dataInteger } from "@tolki/data";

dataInteger({ user: { age: 30 } }, "user.age");
// => 30

dataInteger([{ age: 30 }], "0.age");
// => 30
```

:::

<FnTry label="dataInteger" :fn="dataInteger" :args="[
  { name: 'data', type: 'json', default: { user: { age: 30 } } },
  { name: 'key', default: 'user.age' },
]" />

### intersect

Get the items whose values are also present in the other set. Values are compared as strings, so `2` matches `"2"`. The keys of the kept items stay with them in an object.

Exported as `intersect` from `@tolki/arr` and `@tolki/obj`, and as `dataIntersect` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { intersect } from "@tolki/arr";

intersect(["a", "b", "c"], ["b", "c", "d"]);
// => ["b", "c"]

intersect([1, 2, 3], ["2", "3"]);
// => [2, 3]
```

```js [@tolki/obj]
import { intersect } from "@tolki/obj";

intersect({ a: "green", b: "brown", c: "blue" }, ["blue", "red", "green"]);
// => { a: "green", c: "blue" }
```

```js [@tolki/data]
import { dataIntersect } from "@tolki/data";

dataIntersect(["a", "b", "c"], ["b", "c", "d"]);
// => ["b", "c"]

dataIntersect({ a: "green", b: "brown" }, { x: "green" });
// => { a: "green" }
```

:::

<FnTry label="dataIntersect" :fn="dataIntersect" :args="[
  { name: 'data', type: 'json', default: { a: 'green', b: 'brown', c: 'blue' } },
  { name: 'other', type: 'json', default: ['blue', 'red', 'green'] },
]" />

### intersectAssoc

Get the items whose key and value are both present in the other set.

Exported as `intersectAssoc` from `@tolki/arr` and `@tolki/obj`, and as `dataIntersectAssoc` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { intersectAssoc } from "@tolki/arr";

intersectAssoc(["a", "b", "c"], ["a", "x", "c"]);
// => ["a", "c"]
```

```js [@tolki/obj]
import { intersectAssoc } from "@tolki/obj";

intersectAssoc(
  { a: "green", b: "brown", c: "blue", d: "red" },
  { a: "green", b: "yellow", c: "blue", d: "red" },
);
// => { a: "green", c: "blue", d: "red" }
```

```js [@tolki/data]
import { dataIntersectAssoc } from "@tolki/data";

dataIntersectAssoc({ a: "green", b: "brown" }, { a: "green", b: "red" });
// => { a: "green" }
```

:::

<FnTry label="dataIntersectAssoc" :fn="dataIntersectAssoc" :args="[
  { name: 'data', type: 'json', default: { a: 'green', b: 'brown' } },
  { name: 'other', type: 'json', default: { a: 'green', b: 'red' } },
]" />

### intersectAssocUsing

Get the items whose key and value are both present in the other set, using a callback to say whether two keys match.

Exported as `intersectAssocUsing` from `@tolki/arr` and `@tolki/obj`, and as `dataIntersectAssocUsing` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { intersectAssocUsing } from "@tolki/arr";

const same = (a, b) => String(a) === String(b);

intersectAssocUsing(["a", "b", "c"], ["a", "x", "c"], same);
// => ["a", "c"]
```

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

```js [@tolki/data]
import { dataIntersectAssocUsing } from "@tolki/data";

const same = (a, b) => a.toLowerCase() === b.toLowerCase();

dataIntersectAssocUsing({ a: "green", b: "brown" }, { A: "green" }, same);
// => { a: "green" }
```

:::

<FnTry label="dataIntersectAssocUsing" :fn="dataIntersectAssocUsing" :args="[
  { name: 'data', type: 'json', default: { a: 'green', b: 'brown' } },
  { name: 'other', type: 'json', default: { A: 'green', B: 'yellow' } },
  { name: 'callback', type: 'select', default: keyComparators[0].value, options: keyComparators },
]" />

### intersectByKeys

Get the items whose key is present in the other set. Values are ignored.

Exported as `intersectByKeys` from `@tolki/arr` and `@tolki/obj`, and as `dataIntersectByKeys` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { intersectByKeys } from "@tolki/arr";

intersectByKeys(["a", "b", "c"], ["x", "y"]);
// => ["a", "b"]
```

```js [@tolki/obj]
import { intersectByKeys } from "@tolki/obj";

intersectByKeys(
  { serial: "UX301", type: "screen", year: 2009 },
  { reference: "UX404", type: "tab", year: 2011 },
);
// => { type: "screen", year: 2009 }
```

```js [@tolki/data]
import { dataIntersectByKeys } from "@tolki/data";

dataIntersectByKeys({ a: 1, b: 2, c: 3 }, { a: 0, c: 0 });
// => { a: 1, c: 3 }
```

:::

<FnTry label="dataIntersectByKeys" :fn="dataIntersectByKeys" :args="[
  { name: 'data', type: 'json', default: { a: 1, b: 2, c: 3 } },
  { name: 'other', type: 'json', default: { a: 0, c: 0 } },
]" />

### intersectUsing

Get the items whose values are present in the other set, using a callback to say whether two values are equal.

Exported as `intersectUsing` from `@tolki/arr` and `@tolki/obj`, and as `dataIntersectUsing` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { intersectUsing } from "@tolki/arr";

const same = (a, b) => a.toLowerCase() === b.toLowerCase();

intersectUsing(["Green", "Brown", "Blue"], ["GREEN", "Yellow"], same);
// => ["Green"]
```

```js [@tolki/obj]
import { intersectUsing } from "@tolki/obj";

const same = (a, b) => a.toLowerCase() === b.toLowerCase();

intersectUsing({ a: "green", b: "brown" }, { A: "GREEN" }, same);
// => { a: "green" }
```

```js [@tolki/data]
import { dataIntersectUsing } from "@tolki/data";

const same = (a, b) => a.toLowerCase() === b.toLowerCase();

dataIntersectUsing(["Green", "Brown"], ["GREEN"], same);
// => ["Green"]
```

:::

<FnTry label="dataIntersectUsing" :fn="dataIntersectUsing" :args="[
  { name: 'data', type: 'json', default: ['Green', 'Brown', 'Blue'] },
  { name: 'other', type: 'json', default: ['GREEN', 'Yellow'] },
  { name: 'callback', type: 'select', default: keyComparators[0].value, options: keyComparators },
]" />

### join

Join all items using a string. The final item can use a separate glue string.

Exported as `join` from `@tolki/arr` and `@tolki/obj`, and as `dataJoin` from `@tolki/data`.

Laravel: [`Arr::join()`](https://laravel.com/docs/helpers#method-array-join)

::: code-group

```js [@tolki/arr]
import { join } from "@tolki/arr";

join(["Tailwind", "Alpine", "Laravel", "Livewire"], ", ");
// => "Tailwind, Alpine, Laravel, Livewire"

join(["Tailwind", "Alpine", "Laravel", "Livewire"], ", ", " and ");
// => "Tailwind, Alpine, Laravel and Livewire"

join(["Tailwind", "Alpine"], ", ", " and ");
// => "Tailwind and Alpine"
```

```js [@tolki/obj]
import { join } from "@tolki/obj";

join({ a: "Tailwind", b: "Alpine", c: "Laravel" }, ", ");
// => "Tailwind, Alpine, Laravel"

join({ a: "Tailwind", b: "Alpine", c: "Laravel" }, ", ", " and ");
// => "Tailwind, Alpine and Laravel"
```

```js [@tolki/data]
import { dataJoin } from "@tolki/data";

dataJoin(["a", "b", "c"], ", ", " and ");
// => "a, b and c"

dataJoin({ a: "x", b: "y" }, ", ", " and ");
// => "x and y"
```

:::

<FnTry label="dataJoin" :fn="dataJoin" :args="[
  { name: 'data', type: 'json', default: ['a', 'b', 'c'] },
  { name: 'glue', default: ', ' },
  { name: 'finalGlue', default: ' and ' },
]" />

### keyBy

Key an array or object of rows by a field, or by the result of a callback.

Exported as `keyBy` from `@tolki/arr` and `@tolki/obj`, and as `dataKeyBy` from `@tolki/data`.

Laravel: [`Arr::keyBy()`](https://laravel.com/docs/helpers#method-array-keyby)

::: code-group

```js [@tolki/arr]
import { keyBy } from "@tolki/arr";

const products = [
  { product_id: "prod-100", name: "Desk" },
  { product_id: "prod-200", name: "Chair" },
];

keyBy(products, "product_id");
// => {
//   "prod-100": { product_id: "prod-100", name: "Desk" },
//   "prod-200": { product_id: "prod-200", name: "Chair" },
// }

keyBy(products, (item) => item.product_id.toUpperCase());
// => {
//   "PROD-100": { product_id: "prod-100", name: "Desk" },
//   "PROD-200": { product_id: "prod-200", name: "Chair" },
// }
```

```js [@tolki/obj]
import { keyBy } from "@tolki/obj";

keyBy({ a: { id: 1, name: "Desk" }, b: { id: 2, name: "Chair" } }, "name");
// => { Desk: { id: 1, name: "Desk" }, Chair: { id: 2, name: "Chair" } }
```

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

:::

<FnTry label="dataKeyBy" :fn="dataKeyBy" :args="[
  { name: 'data', type: 'json', default: [{ id: 1, name: 'Desk' }, { id: 2, name: 'Chair' }] },
  { name: 'keyBy', default: 'name' },
]" />

### keys

Get all of the keys of an array or object.

Exported as `keys` from `@tolki/arr` and `@tolki/obj`, and as `dataKeys` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { keys } from "@tolki/arr";

keys(["a", "b"]);
// => [0, 1]
```

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

```js [@tolki/data]
import { dataKeys } from "@tolki/data";

dataKeys(["a", "b"]);
// => [0, 1]

dataKeys({ name: "Desk", price: 100 });
// => ["name", "price"]
```

:::

<FnTry label="dataKeys" :fn="dataKeys" :args="[
  { name: 'data', type: 'json', default: { name: 'Desk', price: 100 } },
]" />

### last

Get the last item, or the last item that passes a truth test. When nothing is found, it returns the default value, or `null`.

Exported as `last` from `@tolki/arr` and `@tolki/obj`, and as `dataLast` from `@tolki/data`.

Laravel: [`Arr::last()`](https://laravel.com/docs/helpers#method-array-last)

::: code-group

```js [@tolki/arr]
import { last } from "@tolki/arr";

last([100, 200, 300]);
// => 300

last([100, 200, 300, 110], (value) => value > 150);
// => 300

last([], null, "none");
// => "none"
```

```js [@tolki/obj]
import { last } from "@tolki/obj";

last({ a: 1, b: 2, c: 3 });
// => 3

last({ a: 1, b: 2, c: 3 }, (value) => value < 3);
// => 2
```

```js [@tolki/data]
import { dataLast } from "@tolki/data";

dataLast([1, 2, 3], (value) => value < 3);
// => 2

dataLast({ a: 1, b: 2, c: 3 });
// => 3
```

:::

<FnTry label="dataLast" :fn="dataLast" :args="[
  { name: 'data', type: 'json', default: { a: 1, b: 2, c: 3 } },
  { name: 'callback', type: 'select', default: predicates[0].value, options: predicates },
]" />

### map

Run a map over each of the items in an array or object. The callback gets the value, then the index or key.

Exported as `map` from `@tolki/arr` and `@tolki/obj`, and as `dataMap` from `@tolki/data`.

Laravel: [`Arr::map()`](https://laravel.com/docs/helpers#method-array-map)

::: code-group

```js [@tolki/arr]
import { map } from "@tolki/arr";

map([1, 2, 3], (value) => value * 2);
// => [2, 4, 6]

map(["a", "b"], (value, index) => `${index}:${value}`);
// => ["0:a", "1:b"]
```

```js [@tolki/obj]
import { map } from "@tolki/obj";

map({ a: 1, b: 2, c: 3 }, (value) => value * 2);
// => { a: 2, b: 4, c: 6 }

map({ a: 1, b: 2 }, (value, key) => `${key}=${value}`);
// => { a: "a=1", b: "b=2" }
```

```js [@tolki/data]
import { dataMap } from "@tolki/data";

dataMap([1, 2, 3], (value) => value * 2);
// => [2, 4, 6]

dataMap({ a: 1, b: 2 }, (value) => value * 2);
// => { a: 2, b: 4 }
```

:::

<FnTry label="dataMap" :fn="dataMap" :args="[
  { name: 'data', type: 'json', default: [1, 2, 3] },
  { name: 'callback', type: 'select', default: mapCallbacks[0].value, options: mapCallbacks },
]" />

### mapSpread

Run a map over each row, spreading the row's items into the callback's arguments, followed by the index or key.

Exported as `mapSpread` from `@tolki/arr` and `@tolki/obj`, and as `dataMapSpread` from `@tolki/data`.

Laravel: [`Arr::mapSpread()`](https://laravel.com/docs/helpers#method-array-map-spread)

::: code-group

```js [@tolki/arr]
import { mapSpread } from "@tolki/arr";

mapSpread(
  [
    ["John", 25],
    ["Jane", 30],
  ],
  (name, age) => `${name} is ${age}`,
);
// => ["John is 25", "Jane is 30"]

mapSpread(
  [
    [1, 2],
    [3, 4],
  ],
  (a, b, index) => a + b + index,
);
// => [3, 8]
```

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

:::

<FnTry label="dataMapSpread" :fn="dataMapSpread" :args="[
  { name: 'data', type: 'json', default: [[1, 2], [3, 4]] },
  { name: 'callback', type: 'select', default: spreadCallbacks[0].value, options: spreadCallbacks },
]" />

### mapWithKeys

Run an associative map over each of the items. The callback returns an object whose pairs become the entries of the result.

Exported as `mapWithKeys` from `@tolki/arr` and `@tolki/obj`, and as `dataMapWithKeys` from `@tolki/data`.

Laravel: [`Arr::mapWithKeys()`](https://laravel.com/docs/helpers#method-array-map-with-keys)

::: code-group

```js [@tolki/arr]
import { mapWithKeys } from "@tolki/arr";

const users = [
  { name: "John", email: "john@example.com" },
  { name: "Jane", email: "jane@example.com" },
];

mapWithKeys(users, (user) => ({ [user.email]: user.name }));
// => { "john@example.com": "John", "jane@example.com": "Jane" }

mapWithKeys(["a", "b"], (value, index) => ({ [value]: index }));
// => { a: 0, b: 1 }
```

```js [@tolki/obj]
import { mapWithKeys } from "@tolki/obj";

mapWithKeys({ a: "x", b: "y" }, (value, key) => ({ [value]: key }));
// => { x: "a", y: "b" }
```

```js [@tolki/data]
import { dataMapWithKeys } from "@tolki/data";

dataMapWithKeys(["a", "b"], (value, index) => ({ [value]: index }));
// => { a: 0, b: 1 }
```

:::

<FnTry label="dataMapWithKeys" :fn="dataMapWithKeys" :args="[
  { name: 'data', type: 'json', default: ['a', 'b'] },
  { name: 'callback', type: 'select', default: keyedCallbacks[0].value, options: keyedCallbacks },
]" />

### only

Get a subset of the items from the given array or object. The result keeps the order of the data, not the order of the keys.

Exported as `only` from `@tolki/arr` and `@tolki/obj`, and as `dataOnly` from `@tolki/data`.

Laravel: [`Arr::only()`](https://laravel.com/docs/helpers#method-array-only)

::: code-group

```js [@tolki/arr]
import { only } from "@tolki/arr";

only(["a", "b", "c", "d"], [0, 2]);
// => ["a", "c"]

only(["a", "b", "c", "d"], [3, 1]);
// => ["b", "d"]
```

```js [@tolki/obj]
import { only } from "@tolki/obj";

only({ name: "Desk", price: 100, discount: false }, ["name", "price"]);
// => { name: "Desk", price: 100 }

only({ b: 1, a: 2 }, ["a", "b"]);
// => { b: 1, a: 2 }
```

```js [@tolki/data]
import { dataOnly } from "@tolki/data";

dataOnly({ a: 1, b: 2, c: 3 }, ["a", "c"]);
// => { a: 1, c: 3 }

dataOnly(["a", "b", "c"], [0, 2]);
// => ["a", "c"]
```

:::

<FnTry label="dataOnly" :fn="dataOnly" :args="[
  { name: 'data', type: 'json', default: { name: 'Desk', price: 100, discount: false } },
  { name: 'keys', type: 'json', default: ['name', 'price'] },
]" />

### onlyValues

Get a subset of the items from the given array or object by value. The comparison is loose, so `"1"` matches `1`; pass `true` as the third argument to compare strictly. See [PHP Semantics](./php-semantics.md#loose-and-strict-comparison).

Exported as `onlyValues` from `@tolki/arr` and `@tolki/obj`, and as `dataOnlyValues` from `@tolki/data`.

Laravel: [`Arr::onlyValues()`](https://laravel.com/docs/helpers#method-array-only-values)

<!-- docs/php-parity/Arr/onlyValues.json, "onlyValues-list-keeps-gap" -->

::: code-group

```js [@tolki/arr]
import { onlyValues } from "@tolki/arr";

// Laravel's list result keeps the original positions (0 and 2); a JavaScript array cannot, so it renumbers.
onlyValues(["foo", "bar", "baz", "qux"], ["foo", "baz"]);
// => ["foo", "baz"]

onlyValues([1, "1", 2], [1]);
// => [1, "1"]

onlyValues([1, "1", 2], [1], true);
// => [1]
```

```js [@tolki/obj]
import { onlyValues } from "@tolki/obj";

onlyValues({ name: "taylor", age: 26, city: "austin" }, [26]);
// => { age: 26 }

onlyValues({ a: 1, b: 2, c: 1, d: 3 }, 1);
// => { a: 1, c: 1 }

onlyValues({ a: 1, b: "1", c: 2 }, [1], true);
// => { a: 1 }
```

```js [@tolki/data]
import { dataOnlyValues } from "@tolki/data";

dataOnlyValues({ name: "taylor", age: 26 }, [26]);
// => { age: 26 }

dataOnlyValues(["foo", "bar", "baz"], ["foo", "baz"]);
// => ["foo", "baz"]
```

:::

<FnTry label="dataOnlyValues" :fn="dataOnlyValues" :args="[
  { name: 'data', type: 'json', default: { a: 1, b: '1', c: 2 } },
  { name: 'values', type: 'json', default: [1] },
  { name: 'strict', type: 'boolean', default: false },
]" />

### pad

Pad an array or object to the specified length with a value. A positive size pads at the end, and a negative size pads at the start.

Exported as `pad` from `@tolki/arr` and `@tolki/obj`, and as `dataPad` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { pad } from "@tolki/arr";

pad([1, 2, 3], 5, 0);
// => [1, 2, 3, 0, 0]

pad([1, 2, 3], -5, 0);
// => [0, 0, 1, 2, 3]
```

```js [@tolki/obj]
import { pad } from "@tolki/obj";

// The pad slots take the next integer keys, and JavaScript lists integer keys first.
pad({ a: 1, b: 2 }, 4, 0);
// => { 0: 0, 1: 0, a: 1, b: 2 }
```

```js [@tolki/data]
import { dataPad } from "@tolki/data";

dataPad([1, 2], 4, 0);
// => [1, 2, 0, 0]

dataPad({ a: 1, b: 2 }, 4, 0);
// => { 0: 0, 1: 0, a: 1, b: 2 }
```

:::

<FnTry label="dataPad" :fn="dataPad" :args="[
  { name: 'data', type: 'json', default: [1, 2, 3] },
  { name: 'size', type: 'number', default: 5 },
  { name: 'value', type: 'json', default: 0 },
]" />

### partition

Partition an array or object into two using the given callback. The result is a pair: the items that pass, then the items that fail.

Exported as `partition` from `@tolki/arr` and `@tolki/obj`, and as `dataPartition` from `@tolki/data`.

Laravel: [`Arr::partition()`](https://laravel.com/docs/helpers#method-array-partition)

::: code-group

```js [@tolki/arr]
import { partition } from "@tolki/arr";

partition([1, 2, 3, 4], (value) => value > 2);
// => [[3, 4], [1, 2]]

partition(["a", "b", null, "c"], (value) => value !== null);
// => [["a", "b", "c"], [null]]
```

```js [@tolki/obj]
import { partition } from "@tolki/obj";

partition({ a: 1, b: 2, c: 3, d: 4 }, (value) => value > 2);
// => [{ c: 3, d: 4 }, { a: 1, b: 2 }]
```

```js [@tolki/data]
import { dataPartition } from "@tolki/data";

dataPartition([1, 2, 3, 4], (value) => value > 2);
// => [[3, 4], [1, 2]]

dataPartition({ a: 1, b: 2, c: 3 }, (value) => value > 1);
// => [{ b: 2, c: 3 }, { a: 1 }]
```

:::

<FnTry label="dataPartition" :fn="dataPartition" :args="[
  { name: 'data', type: 'json', default: [1, 2, 3, 4] },
  { name: 'callback', type: 'select', default: predicates[0].value, options: predicates },
]" />

### pluck

Pluck an array of values from an array or object of rows. The path can be a dot path, and a `*` segment collects every item at that step; see [Wildcards](./dot-notation.md#wildcards).

Exported as `pluck` from `@tolki/arr` and `@tolki/obj`, and as `dataPluck` from `@tolki/data`.

Laravel: [`Arr::pluck()`](https://laravel.com/docs/helpers#method-array-pluck)

::: code-group

```js [@tolki/arr]
import { pluck } from "@tolki/arr";

const posts = [
  { title: "A", author: { name: "Ann" }, tags: [{ id: 1 }, { id: 2 }] },
  { title: "B", author: { name: "Bob" }, tags: [{ id: 3 }] },
];

pluck(posts, "author.name");
// => ["Ann", "Bob"]

pluck(posts, "author.name", "title");
// => { A: "Ann", B: "Bob" }

pluck(posts, "tags.*.id");
// => [[1, 2], [3]]
```

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

```js [@tolki/data]
import { dataPluck } from "@tolki/data";

dataPluck([{ name: "John" }, { name: "Jane" }], "name");
// => ["John", "Jane"]

dataPluck({ a: { name: "John" }, b: { name: "Jane" } }, "name");
// => ["John", "Jane"]
```

:::

<FnTry label="dataPluck" :fn="dataPluck" :args="[
  { name: 'data', type: 'json', default: [{ title: 'A', author: { name: 'Ann' } }, { title: 'B', author: { name: 'Bob' } }] },
  { name: 'value', default: 'author.name' },
  { name: 'key', default: 'title' },
]" />

### pop

Get and remove the last N items from an array or object. It changes the data you pass in, unlike most functions on this page. See [Return values instead of references](./differences.md#return-values-instead-of-references).

Exported as `pop` from `@tolki/arr` and `@tolki/obj`, and as `dataPop` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { pop } from "@tolki/arr";

const stack = [1, 2, 3];

pop(stack);
// => 3

stack;
// => [1, 2]

pop(stack, 2);
// => [2, 1]

stack;
// => []
```

```js [@tolki/obj]
import { pop } from "@tolki/obj";

const stock = { a: 1, b: 2 };

pop(stock);
// => 2

stock;
// => { a: 1 }
```

```js [@tolki/data]
import { dataPop } from "@tolki/data";

const stack = [1, 2, 3];

dataPop(stack);
// => 3

stack;
// => [1, 2]
```

:::

<FnTry label="dataPop" :fn="dataPop" :args="[
  { name: 'data', type: 'json', default: [1, 2, 3] },
  { name: 'count', type: 'number', default: 2 },
]" />

### prepend

Push an item onto the beginning of an array or object. It returns a new value and leaves the original unchanged.

Exported as `prepend` from `@tolki/arr` and `@tolki/obj`, and as `dataPrepend` from `@tolki/data`.

Laravel: [`Arr::prepend()`](https://laravel.com/docs/helpers#method-array-prepend)

::: code-group

```js [@tolki/arr]
import { prepend } from "@tolki/arr";

const letters = ["b", "c"];

prepend(letters, "a");
// => ["a", "b", "c"]

letters;
// => ["b", "c"]
```

```js [@tolki/obj]
import { prepend } from "@tolki/obj";

const sizes = { b: 2, c: 3 };

prepend(sizes, 1, "a");
// => { a: 1, b: 2, c: 3 }

sizes;
// => { b: 2, c: 3 }
```

```js [@tolki/data]
import { dataPrepend } from "@tolki/data";

dataPrepend([2, 3], 1);
// => [1, 2, 3]

dataPrepend({ b: 2, c: 3 }, 1, "a");
// => { a: 1, b: 2, c: 3 }
```

:::

<FnTry label="dataPrepend" :fn="dataPrepend" :args="[
  { name: 'data', type: 'json', default: { b: 2, c: 3 } },
  { name: 'value', type: 'json', default: 1 },
  { name: 'key', default: 'a' },
]" />

### prependKeysWith

Prepend the key names of an array or object with the given string.

Exported as `prependKeysWith` from `@tolki/arr` and `@tolki/obj`, and as `dataPrependKeysWith` from `@tolki/data`.

Laravel: [`Arr::prependKeysWith()`](https://laravel.com/docs/helpers#method-array-prependkeyswith)

::: code-group

```js [@tolki/arr]
import { prependKeysWith } from "@tolki/arr";

// A list has no key names, so its indexes become the keys.
prependKeysWith(["a", "b"], "item_");
// => { item_0: "a", item_1: "b" }
```

```js [@tolki/obj]
import { prependKeysWith } from "@tolki/obj";

prependKeysWith({ a: 1, b: 2, c: 3 }, "item_");
// => { item_a: 1, item_b: 2, item_c: 3 }
```

```js [@tolki/data]
import { dataPrependKeysWith } from "@tolki/data";

dataPrependKeysWith({ a: 1, b: 2 }, "item_");
// => { item_a: 1, item_b: 2 }
```

:::

<FnTry label="dataPrependKeysWith" :fn="dataPrependKeysWith" :args="[
  { name: 'data', type: 'json', default: { a: 1, b: 2 } },
  { name: 'prependWith', default: 'item_' },
]" />

### pull

Get a value from an array or object, and remove it. It returns `{ value, data }`, where `data` is what is left, and it leaves the original unchanged. See [Return values instead of references](./differences.md#return-values-instead-of-references).

Exported as `pull` from `@tolki/arr` and `@tolki/obj`, and as `dataPull` from `@tolki/data`.

Laravel: [`Arr::pull()`](https://laravel.com/docs/helpers#method-array-pull)

::: code-group

```js [@tolki/arr]
import { pull } from "@tolki/arr";

const letters = ["a", ["b", "c"]];

pull(letters, "1.0");
// => { value: "b", data: ["a", ["c"]] }

letters;
// => ["a", ["b", "c"]]

pull(["a"], 5, "none");
// => { value: "none", data: ["a"] }
```

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

```js [@tolki/data]
import { dataPull } from "@tolki/data";

dataPull({ a: 1, b: 2 }, "b");
// => { value: 2, data: { a: 1 } }

dataPull(["a", "b", "c"], 1);
// => { value: "b", data: ["a", "c"] }
```

:::

<FnTry label="dataPull" :fn="dataPull" :args="[
  { name: 'data', type: 'json', default: { user: { name: 'John', age: 30 } } },
  { name: 'key', default: 'user.name' },
  { name: 'defaultValue', default: 'none' },
]" />

### push

Push one or more items into the array at the given key, using "dot" notation. It returns a new value and leaves the original unchanged. See [Return values instead of references](./differences.md#return-values-instead-of-references).

Exported as `push` from `@tolki/arr` and `@tolki/obj`, and as `dataPush` from `@tolki/data`.

Laravel: [`Arr::push()`](https://laravel.com/docs/helpers#method-array-push)

::: code-group

```js [@tolki/arr]
import { push } from "@tolki/arr";

const rows = [["a"], ["b"]];

push(rows, "1", "c");
// => [["a"], ["b", "c"]]

rows;
// => [["a"], ["b"]]

push([1, 2], null, 3, 4);
// => [1, 2, 3, 4]
```

```js [@tolki/obj]
import { push } from "@tolki/obj";

const cart = { items: ["a", "b"] };

push(cart, "items", "c", "d");
// => { items: ["a", "b", "c", "d"] }

cart;
// => { items: ["a", "b"] }

push({}, "items", "a");
// => { items: ["a"] }

push({ a: 1 }, "a", 2);
// => throws InvalidArgumentException
```

```js [@tolki/data]
import { dataPush } from "@tolki/data";

dataPush({ a: [1, 2] }, "a", 3, 4);
// => { a: [1, 2, 3, 4] }

dataPush([1, 2], null, 3, 4);
// => [1, 2, 3, 4]
```

:::

<FnTry label="dataPush" :fn="dataPush" :args="[
  { name: 'data', type: 'json', default: { user: { tags: ['js'] } } },
  { name: 'key', default: 'user.tags' },
  { name: 'values', default: 'ts' },
]" />

### query

Convert an array or object into a URL-encoded query string.

Exported as `query` from `@tolki/arr` and `@tolki/obj`, and as `dataQuery` from `@tolki/data`.

Laravel: [`Arr::query()`](https://laravel.com/docs/helpers#method-array-query)

::: code-group

```js [@tolki/arr]
import { query } from "@tolki/arr";

query(["a", "b"]);
// => "0=a&1=b"

query([["x", "y"]]);
// => "0%5B0%5D=x&0%5B1%5D=y"
```

```js [@tolki/obj]
import { query } from "@tolki/obj";

query({ name: "John", age: 30 });
// => "name=John&age=30"

query({ user: { name: "John" }, tags: ["php", "js"] });
// => "user%5Bname%5D=John&tags%5B0%5D=php&tags%5B1%5D=js"

query({ q: "a b&c", on: true, off: false, none: null });
// => "q=a%20b%26c&on=1&off=0"
```

```js [@tolki/data]
import { dataQuery } from "@tolki/data";

dataQuery({ name: "John", age: 30 });
// => "name=John&age=30"

dataQuery(["a", "b"]);
// => "0=a&1=b"
```

:::

<FnTry label="dataQuery" :fn="dataQuery" :args="[
  { name: 'data', type: 'json', default: { name: 'John', tags: ['php', 'js'], active: true } },
]" />

### random

Get one or a specified number of random values from an array or object. The picked items come back in the order they have in the data.

Exported as `random` from `@tolki/arr` and `@tolki/obj`, and as `dataRandom` from `@tolki/data`.

Laravel: [`Arr::random()`](https://laravel.com/docs/helpers#method-array-random)

::: code-group

```js [@tolki/arr]
import { random } from "@tolki/arr";

random([1, 2, 3, 4], 2);
// e.g. [2, 4]

random([1, 2, 3, 4], 2).length;
// => 2

[1, 2, 3].includes(random([1, 2, 3]));
// => true

random([1, 2], 5);
// => throws InvalidArgumentException
```

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

```js [@tolki/data]
import { dataRandom } from "@tolki/data";

dataRandom([1, 2, 3, 4], 2);
// e.g. [2, 4]

dataRandom({ a: 1, b: 2, c: 3 }, 1);
// e.g. { 0: 2 }

dataRandom([1, 2, 3, 4], 3).length;
// => 3
```

:::

<FnTry label="dataRandom" :fn="dataRandom" :args="[
  { name: 'data', type: 'json', default: [1, 2, 3, 4] },
  { name: 'number', type: 'number', default: 2 },
]" />

### reject

Filter an array or object using the negation of the given callback: the items that fail the test stay.

Exported as `reject` from `@tolki/arr` and `@tolki/obj`, and as `dataReject` from `@tolki/data`.

Laravel: [`Arr::reject()`](https://laravel.com/docs/helpers#method-array-reject)

::: code-group

```js [@tolki/arr]
import { reject } from "@tolki/arr";

reject([1, 2, 3, 4], (value) => value > 2);
// => [1, 2]

reject(["a", "b", null, "c"], (value) => value === null);
// => ["a", "b", "c"]
```

```js [@tolki/obj]
import { reject } from "@tolki/obj";

reject({ a: 1, b: 2, c: 3, d: 4 }, (value) => value > 2);
// => { a: 1, b: 2 }
```

```js [@tolki/data]
import { dataReject } from "@tolki/data";

dataReject([1, 2, 3], (value) => value > 1);
// => [1]

dataReject({ a: 1, b: 2, c: 3 }, (value) => value > 1);
// => { a: 1 }
```

:::

<FnTry label="dataReject" :fn="dataReject" :args="[
  { name: 'data', type: 'json', default: [1, 2, 3, 4] },
  { name: 'callback', type: 'select', default: predicates[1].value, options: predicates },
]" />

### replace

Replace the items of an array or object with the given replacer items. It returns a new value. Only the top level is replaced; see `replaceRecursive` for nested values.

Exported as `replace` from `@tolki/arr` and `@tolki/obj`, and as `dataReplace` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { replace } from "@tolki/arr";

replace(["a", "b", "c"], ["d", "e"]);
// => ["d", "e", "c"]

replace(["a", "b", "c"], { 1: "d", 2: "e", 3: "f" });
// => ["a", "d", "e", "f"]
```

```js [@tolki/obj]
import { replace } from "@tolki/obj";

replace({ a: 1, b: 2 }, { b: 3, c: 4 });
// => { a: 1, b: 3, c: 4 }

replace({ a: { x: 1, y: 2 } }, { a: { x: 9 } });
// => { a: { x: 9 } }
```

```js [@tolki/data]
import { dataReplace } from "@tolki/data";

dataReplace({ a: 1, b: 2 }, { b: 3, c: 4 });
// => { a: 1, b: 3, c: 4 }

dataReplace([1, 2, 3], [9]);
// => [9, 2, 3]
```

:::

<FnTry label="dataReplace" :fn="dataReplace" :args="[
  { name: 'data', type: 'json', default: { a: 1, b: 2 } },
  { name: 'replacerData', type: 'json', default: { b: 3, c: 4 } },
]" />

### replaceRecursive

Recursively replace the items of an array or object with the given items. Two nested arrays or objects merge, and any other value is replaced. It returns a new value.

Exported as `replaceRecursive` from `@tolki/arr` and `@tolki/obj`, and as `dataReplaceRecursive` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { replaceRecursive } from "@tolki/arr";

replaceRecursive([{ a: 1, b: { c: 2, d: 3 } }], [{ b: { c: 9 } }]);
// => [{ a: 1, b: { c: 9, d: 3 } }]

replaceRecursive([["a", "b"], ["c"]], [["x"]]);
// => [["x", "b"], ["c"]]
```

```js [@tolki/obj]
import { replaceRecursive } from "@tolki/obj";

replaceRecursive(
  { user: { name: "John", age: 30 }, tags: ["a", "b"] },
  { user: { age: 31 }, tags: ["z"] },
);
// => { user: { name: "John", age: 31 }, tags: ["z", "b"] }
```

```js [@tolki/data]
import { dataReplaceRecursive } from "@tolki/data";

dataReplaceRecursive(
  { user: { name: "John", age: 30 } },
  { user: { age: 31 } },
);
// => { user: { name: "John", age: 31 } }
```

:::

<FnTry label="dataReplaceRecursive" :fn="dataReplaceRecursive" :args="[
  { name: 'data', type: 'json', default: { user: { name: 'John', age: 30 } } },
  { name: 'replacerData', type: 'json', default: { user: { age: 31 } } },
]" />

### reverse

Reverse the order of an array or object and return the result.

Exported as `reverse` from `@tolki/arr` and `@tolki/obj`, and as `dataReverse` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { reverse } from "@tolki/arr";

reverse([1, 2, 3]);
// => [3, 2, 1]

reverse(["a", "b", "c"]);
// => ["c", "b", "a"]
```

```js [@tolki/obj]
import { reverse } from "@tolki/obj";

reverse({ a: 1, b: 2, c: 3 });
// => { c: 3, b: 2, a: 1 }
```

```js [@tolki/data]
import { dataReverse } from "@tolki/data";

dataReverse([1, 2, 3]);
// => [3, 2, 1]

dataReverse({ a: 1, b: 2, c: 3 });
// => { c: 3, b: 2, a: 1 }
```

:::

<FnTry label="dataReverse" :fn="dataReverse" :args="[
  { name: 'data', type: 'json', default: { a: 1, b: 2, c: 3 } },
]" />

### search

Search for a value in an array or object and return its key. It returns `false` when nothing matches. The comparison is loose by default, so `"2"` matches `2`; pass `true` as the third argument to compare strictly. See [PHP Semantics](./php-semantics.md#loose-and-strict-comparison).

Exported as `dataSearch` from `@tolki/data`.

::: code-group

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

:::

<FnTry label="dataSearch" :fn="dataSearch" :args="[
  { name: 'data', type: 'json', default: { a: 1, b: 2 } },
  { name: 'value', type: 'number', default: 2 },
]" />

### select

Select an array or object of values from each item in an array or object. Each key is an exact name, not a dot path.

Exported as `select` from `@tolki/arr` and `@tolki/obj`, and as `dataSelect` from `@tolki/data`.

Laravel: [`Arr::select()`](https://laravel.com/docs/helpers#method-array-select)

::: code-group

```js [@tolki/arr]
import { select } from "@tolki/arr";

const products = [
  { name: "Desk", price: 100, sku: "D1" },
  { name: "Chair", price: 50, sku: "C1" },
];

select(products, ["name", "price"]);
// => [{ name: "Desk", price: 100 }, { name: "Chair", price: 50 }]

select(products, "name");
// => [{ name: "Desk" }, { name: "Chair" }]

select([{ a: { b: 1 }, c: 2 }], "a.b");
// => [{}]
```

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

```js [@tolki/data]
import { dataSelect } from "@tolki/data";

dataSelect([{ a: 1, b: 2, c: 3 }], ["a", "c"]);
// => [{ a: 1, c: 3 }]
```

:::

<FnTry label="dataSelect" :fn="dataSelect" :args="[
  { name: 'data', type: 'json', default: [{ name: 'Desk', price: 100, sku: 'D1' }, { name: 'Chair', price: 50, sku: 'C1' }] },
  { name: 'keys', type: 'json', default: ['name', 'price'] },
]" />

### set

Set an array or object item to a given value using "dot" notation. It returns a new value and leaves the original unchanged. See [Return values instead of references](./differences.md#return-values-instead-of-references).

Exported as `set` from `@tolki/arr` and `@tolki/obj`, and as `dataSet` from `@tolki/data`.

Laravel: [`Arr::set()`](https://laravel.com/docs/helpers#method-array-set) · [`data_set()`](https://laravel.com/docs/helpers#method-data-set)

::: code-group

```js [@tolki/arr]
import { set } from "@tolki/arr";

const grid = [["a", "b"]];

set(grid, "0.1", "x");
// => [["a", "x"]]

grid;
// => [["a", "b"]]

set(["a", "b", "c"], 1, "x");
// => ["a", "x", "c"]
```

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

```js [@tolki/data]
import { dataSet } from "@tolki/data";

dataSet({ a: 1 }, "b.c", 3);
// => { a: 1, b: { c: 3 } }

dataSet(["a", "b"], 1, "x");
// => ["a", "x"]
```

:::

<FnTry label="dataSet" :fn="dataSet" :args="[
  { name: 'data', type: 'json', default: { user: { name: 'John' } } },
  { name: 'key', default: 'user.age' },
  { name: 'value', type: 'json', default: 30 },
]" />

### shift

Get and remove the first N items from an array or object. It changes the data you pass in, unlike most functions on this page. See [Return values instead of references](./differences.md#return-values-instead-of-references).

Exported as `shift` from `@tolki/arr` and `@tolki/obj`, and as `dataShift` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { shift } from "@tolki/arr";

const queue = [1, 2, 3];

shift(queue);
// => 1

queue;
// => [2, 3]

shift(queue, 2);
// => [2, 3]

queue;
// => []
```

```js [@tolki/obj]
import { shift } from "@tolki/obj";

const stock = { a: 1, b: 2, c: 3 };

shift(stock);
// => 1

stock;
// => { b: 2, c: 3 }
```

```js [@tolki/data]
import { dataShift } from "@tolki/data";

const queue = [1, 2, 3];

dataShift(queue);
// => 1

queue;
// => [2, 3]
```

:::

<FnTry label="dataShift" :fn="dataShift" :args="[
  { name: 'data', type: 'json', default: [1, 2, 3] },
  { name: 'count', type: 'number', default: 2 },
]" />

### shuffle

Shuffle an array or object and return the result. The result is a new value; an object comes back as a list-like object whose keys are `0` to `n - 1`.

Exported as `shuffle` from `@tolki/arr` and `@tolki/obj`, and as `dataShuffle` from `@tolki/data`.

Laravel: [`Arr::shuffle()`](https://laravel.com/docs/helpers#method-array-shuffle)

::: code-group

```js [@tolki/arr]
import { shuffle } from "@tolki/arr";

shuffle([1, 2, 3, 4, 5]);
// e.g. [3, 1, 5, 2, 4]

shuffle([1, 2, 3, 4, 5]).length;
// => 5

shuffle([3, 1, 2]).sort();
// => [1, 2, 3]
```

```js [@tolki/obj]
import { shuffle } from "@tolki/obj";

shuffle({ a: 1, b: 2, c: 3 });
// e.g. { 0: 3, 1: 1, 2: 2 }

Object.keys(shuffle({ a: 1, b: 2, c: 3 }));
// => ["0", "1", "2"]
```

```js [@tolki/data]
import { dataShuffle } from "@tolki/data";

dataShuffle([1, 2, 3, 4]);
// e.g. [3, 1, 4, 2]

dataShuffle([1, 2, 3, 4]).length;
// => 4
```

:::

<FnTry label="dataShuffle" :fn="dataShuffle" :args="[
  { name: 'data', type: 'json', default: [1, 2, 3, 4, 5] },
]" />

### skipUntil

Skip items in an array or object until the given condition is met, and return the rest. The condition is a value, matched strictly, so `"2"` does not match `2`, or a callback.

Exported as `skipUntil` from `@tolki/arr` and `@tolki/obj`, and as `dataSkipUntil` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { skipUntil } from "@tolki/arr";

skipUntil([1, 2, 3, 4], 3);
// => [3, 4]

skipUntil([1, 2, 3, 4], (value) => value >= 3);
// => [3, 4]

skipUntil([1, 2, 3, 4], 5);
// => []

skipUntil([1, 2, 3], "2");
// => []
```

```js [@tolki/obj]
import { skipUntil } from "@tolki/obj";

skipUntil({ a: 1, b: 2, c: 3 }, 2);
// => { b: 2, c: 3 }

skipUntil({ a: 1, b: 2, c: 3 }, (value, key) => key === "b");
// => { b: 2, c: 3 }
```

```js [@tolki/data]
import { dataSkipUntil } from "@tolki/data";

dataSkipUntil([1, 2, 3, 4], 3);
// => [3, 4]

dataSkipUntil({ a: 1, b: 2, c: 3 }, (value) => value > 1);
// => { b: 2, c: 3 }
```

:::

<FnTry label="dataSkipUntil" :fn="dataSkipUntil" :args="[
  { name: 'data', type: 'json', default: [1, 2, 3, 4] },
  { name: 'value', type: 'number', default: 3 },
]" />

### skipWhile

Skip items in an array or object while the given condition is met, and return the rest. The condition is a value, matched strictly, or a callback.

Exported as `skipWhile` from `@tolki/arr` and `@tolki/obj`, and as `dataSkipWhile` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { skipWhile } from "@tolki/arr";

skipWhile([1, 1, 2, 1], 1);
// => [2, 1]

skipWhile([1, 2, 3, 4], (value) => value < 3);
// => [3, 4]

skipWhile([1, 2, 3, 4], 5);
// => [1, 2, 3, 4]
```

```js [@tolki/obj]
import { skipWhile } from "@tolki/obj";

skipWhile({ a: 1, b: 1, c: 2, d: 1 }, 1);
// => { c: 2, d: 1 }

skipWhile({ a: 1, b: 2, c: 3 }, (value, key) => key === "a");
// => { b: 2, c: 3 }
```

```js [@tolki/data]
import { dataSkipWhile } from "@tolki/data";

dataSkipWhile([1, 1, 2, 1], 1);
// => [2, 1]

dataSkipWhile({ a: 1, b: 2, c: 3 }, (value) => value < 2);
// => { b: 2, c: 3 }
```

:::

<FnTry label="dataSkipWhile" :fn="dataSkipWhile" :args="[
  { name: 'data', type: 'json', default: [1, 1, 2, 1] },
  { name: 'value', type: 'number', default: 1 },
]" />

### slice

Get a portion of an array or object, starting at an offset. The original is left unchanged; `splice` is the function that removes items.

Exported as `slice` from `@tolki/arr` and `@tolki/obj`, and as `dataSlice` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { slice } from "@tolki/arr";

slice([1, 2, 3, 4, 5], 1, 3);
// => [2, 3, 4]

slice([1, 2, 3, 4, 5], -2);
// => [4, 5]

slice([1, 2, 3, 4, 5], 1, -1);
// => [2, 3, 4]
```

```js [@tolki/obj]
import { slice } from "@tolki/obj";

slice({ a: 1, b: 2, c: 3, d: 4 }, 1, 2);
// => { b: 2, c: 3 }

slice({ a: 1, b: 2, c: 3, d: 4 }, -2);
// => { c: 3, d: 4 }
```

```js [@tolki/data]
import { dataSlice } from "@tolki/data";

dataSlice([1, 2, 3, 4], 1, 2);
// => [2, 3]

dataSlice({ a: 1, b: 2, c: 3 }, 1);
// => { b: 2, c: 3 }
```

:::

<FnTry label="dataSlice" :fn="dataSlice" :args="[
  { name: 'data', type: 'json', default: [1, 2, 3, 4, 5] },
  { name: 'offset', type: 'number', default: 1 },
  { name: 'length', type: 'number', default: 2 },
]" />

### sole

Get the first item, but only if exactly one item exists. Otherwise it throws `ItemNotFoundException` when none is found, or `MultipleItemsFoundException` when several are. With a callback, it counts only the items the callback accepts.

Exported as `sole` from `@tolki/arr` and `@tolki/obj`, and as `dataSole` from `@tolki/data`.

Laravel: [`Arr::sole()`](https://laravel.com/docs/helpers#method-array-sole)

::: code-group

```js [@tolki/arr]
import { sole } from "@tolki/arr";

sole([42]);
// => 42

sole([1, 2, 3], (value) => value > 2);
// => 3

sole([]);
// => throws ItemNotFoundException

sole([1, 2]);
// => throws MultipleItemsFoundException
```

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

```js [@tolki/data]
import { dataSole } from "@tolki/data";

dataSole([42]);
// => 42

dataSole({ a: 1, b: 2 }, (value) => value > 1);
// => 2

dataSole([1, 2]);
// => throws MultipleItemsFoundException
```

:::

<FnTry label="dataSole" :fn="dataSole" :args="[
  { name: 'data', type: 'json', default: [42] },
]" />

### some

Determine if some items pass the given truth test.

Exported as `some` from `@tolki/arr` and `@tolki/obj`, and as `dataSome` from `@tolki/data`.

Laravel: [`Arr::some()`](https://laravel.com/docs/helpers#method-array-some)

::: code-group

```js [@tolki/arr]
import { some } from "@tolki/arr";

some([1, 2, 3], (value) => value % 2 === 0);
// => true

some([1, 3, 5], (value) => value % 2 === 0);
// => false
```

```js [@tolki/obj]
import { some } from "@tolki/obj";

some({ a: 1, b: 2 }, (value, key) => key === "b");
// => true

some({ a: 1, b: 2 }, (value) => value > 2);
// => false
```

```js [@tolki/data]
import { dataSome } from "@tolki/data";

dataSome([1, 3, 5], (value) => value % 2 === 0);
// => false

dataSome({ a: 1, b: 2 }, (value) => value > 1);
// => true
```

:::

<FnTry label="dataSome" :fn="dataSome" :args="[
  { name: 'data', type: 'json', default: [1, 2, 3] },
  { name: 'callback', type: 'select', default: predicates[0].value, options: predicates },
]" />

### sort

Sort an array or object by its values, by a callback, by a "dot" path, or by a list of sort descriptors. It returns a new value and leaves the original unchanged.

Exported as `sort` from `@tolki/arr` and `@tolki/obj`, and as `dataSort` from `@tolki/data`.

Laravel: [`Arr::sort()`](https://laravel.com/docs/helpers#method-array-sort)

::: code-group

```js [@tolki/arr]
import { sort } from "@tolki/arr";

sort([3, 1, 4, 1, 5]);
// => [1, 1, 3, 4, 5]

const people = [
  { name: "John", age: 25 },
  { name: "Jane", age: 30 },
  { name: "Al", age: 20 },
];

sort(people, "age");
// => [
//   { name: "Al", age: 20 },
//   { name: "John", age: 25 },
//   { name: "Jane", age: 30 },
// ]

sort(people, (person) => person.name);
// => [
//   { name: "Al", age: 20 },
//   { name: "Jane", age: 30 },
//   { name: "John", age: 25 },
// ]
```

```js [@tolki/obj]
import { sort } from "@tolki/obj";

// Each key stays with its value.
sort({ a: 3, b: 1, c: 2 });
// => { b: 1, c: 2, a: 3 }

sort({ x: { n: 2 }, y: { n: 1 } }, "n");
// => { y: { n: 1 }, x: { n: 2 } }
```

```js [@tolki/data]
import { dataSort } from "@tolki/data";

dataSort([3, 1, 2]);
// => [1, 2, 3]

dataSort({ a: 3, b: 1, c: 2 });
// => { b: 1, c: 2, a: 3 }
```

:::

<FnTry label="dataSort" :fn="dataSort" :args="[
  { name: 'data', type: 'json', default: [3, 1, 4, 1, 5] },
]" />

### sortDesc

Sort an array or object in descending order. It takes the same callbacks, paths and descriptors as `sort`, and returns a new value.

Exported as `sortDesc` from `@tolki/arr` and `@tolki/obj`, and as `dataSortDesc` from `@tolki/data`.

Laravel: [`Arr::sortDesc()`](https://laravel.com/docs/helpers#method-array-sort-desc)

::: code-group

```js [@tolki/arr]
import { sortDesc } from "@tolki/arr";

sortDesc([3, 1, 4, 1, 5]);
// => [5, 4, 3, 1, 1]

sortDesc(["banana", "apple", "cherry"]);
// => ["cherry", "banana", "apple"]
```

```js [@tolki/obj]
import { sortDesc } from "@tolki/obj";

// Each key stays with its value.
sortDesc({ a: 3, b: 1, c: 2 });
// => { a: 3, c: 2, b: 1 }
```

```js [@tolki/data]
import { dataSortDesc } from "@tolki/data";

dataSortDesc([3, 1, 2]);
// => [3, 2, 1]

dataSortDesc({ a: 3, b: 1, c: 2 });
// => { a: 3, c: 2, b: 1 }
```

:::

<FnTry label="dataSortDesc" :fn="dataSortDesc" :args="[
  { name: 'data', type: 'json', default: [3, 1, 4, 1, 5] },
]" />

### sortRecursive

Recursively sort an array or object by its keys and values. Nested lists sort by value and nested objects sort by key.

Exported as `sortRecursive` from `@tolki/arr` and `@tolki/obj`, and as `dataSortRecursive` from `@tolki/data`.

Laravel: [`Arr::sortRecursive()`](https://laravel.com/docs/helpers#method-array-sort-recursive)

::: code-group

```js [@tolki/arr]
import { sortRecursive } from "@tolki/arr";

sortRecursive([
  [3, 1, 2],
  [9, 8],
]);
// => [[8, 9], [1, 2, 3]]
```

```js [@tolki/obj]
import { sortRecursive } from "@tolki/obj";

sortRecursive({ b: [3, 1, 2], a: { d: 2, c: 1 } });
// => { a: { c: 1, d: 2 }, b: [1, 2, 3] }
```

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

:::

<FnTry label="dataSortRecursive" :fn="dataSortRecursive" :args="[
  { name: 'data', type: 'json', default: { b: [3, 1, 2], a: { d: 2, c: 1 } } },
]" />

### sortRecursiveDesc

Recursively sort an array or object by its keys and values in descending order.

Exported as `sortRecursiveDesc` from `@tolki/arr` and `@tolki/obj`, and as `dataSortRecursiveDesc` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { sortRecursiveDesc } from "@tolki/arr";

sortRecursiveDesc([
  [1, 3, 2],
  [8, 9],
]);
// => [[3, 2, 1], [9, 8]]
```

```js [@tolki/obj]
import { sortRecursiveDesc } from "@tolki/obj";

sortRecursiveDesc({ a: [1, 2, 3], b: { c: 1, d: 2 } });
// => { b: { d: 2, c: 1 }, a: [3, 2, 1] }
```

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

:::

<FnTry label="dataSortRecursiveDesc" :fn="dataSortRecursiveDesc" :args="[
  { name: 'data', type: 'json', default: { a: [1, 2, 3], b: { c: 1, d: 2 } } },
]" />

### splice

Remove a portion of an array or object, optionally put replacements in its place, and return what was removed. It changes the data you pass in, unlike most functions on this page. See [Return values instead of references](./differences.md#return-values-instead-of-references).

Exported as `splice` from `@tolki/arr` and `@tolki/obj`, and as `dataSplice` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { splice } from "@tolki/arr";

const queue = [1, 2, 3, 4, 5];

splice(queue, 1, 2);
// => [2, 3]

queue;
// => [1, 4, 5]

splice(queue, 1, 0, ["a", "b"]);
// => []

queue;
// => [1, "a", "b", 4, 5]

splice(queue, 3);
// => [4, 5]

queue;
// => [1, "a", "b"]
```

```js [@tolki/obj]
import { splice } from "@tolki/obj";

const stock = { a: 1, b: 2, c: 3, d: 4 };

splice(stock, 1, 2);
// => { b: 2, c: 3 }

stock;
// => { a: 1, d: 4 }
```

```js [@tolki/data]
import { dataSplice } from "@tolki/data";

const queue = [1, 2, 3, 4, 5];

dataSplice(queue, 1, 2);
// => [2, 3]

queue;
// => [1, 4, 5]
```

:::

<FnTry label="dataSplice" :fn="dataSplice" :args="[
  { name: 'data', type: 'json', default: [1, 2, 3, 4, 5] },
  { name: 'offset', type: 'number', default: 1 },
  { name: 'length', type: 'number', default: 2 },
]" />

### string

Get a string item using "dot" notation, throwing an `InvalidArgumentException` if the value is not a string.

Exported as `string` from `@tolki/arr` and `@tolki/obj`, and as `dataString` from `@tolki/data`.

Laravel: [`Arr::string()`](https://laravel.com/docs/helpers#method-array-string)

::: code-group

```js [@tolki/arr]
import { string } from "@tolki/arr";

string([{ name: "John" }], "0.name");
// => "John"

string([{ name: "John" }], "0.title", "n/a");
// => "n/a"

string([{ name: 123 }], "0.name");
// => throws InvalidArgumentException
```

```js [@tolki/obj]
import { string } from "@tolki/obj";

string({ name: "John" }, "name");
// => "John"

string({ name: 123 }, "name");
// => throws InvalidArgumentException
```

```js [@tolki/data]
import { dataString } from "@tolki/data";

dataString({ user: { name: "John" } }, "user.name");
// => "John"

dataString(["a", 1], 0);
// => "a"

dataString(["a", 1], 1);
// => throws InvalidArgumentException
```

:::

<FnTry label="dataString" :fn="dataString" :args="[
  { name: 'data', type: 'json', default: { user: { name: 'John' } } },
  { name: 'key', default: 'user.name' },
]" />

### take

Take the first or last N items of an array or object. A negative number takes from the end.

Exported as `take` from `@tolki/arr` and `@tolki/obj`, and as `dataTake` from `@tolki/data`.

Laravel: [`Arr::take()`](https://laravel.com/docs/helpers#method-array-take)

::: code-group

```js [@tolki/arr]
import { take } from "@tolki/arr";

take([1, 2, 3, 4, 5], 2);
// => [1, 2]

take([1, 2, 3, 4, 5], -2);
// => [4, 5]

take([1, 2, 3], 5);
// => [1, 2, 3]
```

```js [@tolki/obj]
import { take } from "@tolki/obj";

take({ a: 1, b: 2, c: 3 }, 2);
// => { a: 1, b: 2 }

take({ a: 1, b: 2, c: 3 }, -2);
// => { b: 2, c: 3 }
```

```js [@tolki/data]
import { dataTake } from "@tolki/data";

dataTake([1, 2, 3, 4], 2);
// => [1, 2]

dataTake({ a: 1, b: 2, c: 3 }, -1);
// => { c: 3 }
```

:::

<FnTry label="dataTake" :fn="dataTake" :args="[
  { name: 'data', type: 'json', default: [1, 2, 3, 4, 5] },
  { name: 'limit', type: 'number', default: 2 },
]" />

### takeUntil

Take items from an array or object until the given condition is met. The condition is a value, matched strictly, or a callback.

Exported as `takeUntil` from `@tolki/arr` and `@tolki/obj`, and as `dataTakeUntil` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { takeUntil } from "@tolki/arr";

takeUntil([1, 2, 3, 4], 3);
// => [1, 2]

takeUntil([1, 2, 3, 4], (value) => value >= 3);
// => [1, 2]

takeUntil([1, 2, 3, 4], 99);
// => [1, 2, 3, 4]
```

```js [@tolki/obj]
import { takeUntil } from "@tolki/obj";

takeUntil({ a: 1, b: 2, c: 3 }, 3);
// => { a: 1, b: 2 }

takeUntil({ a: 1, b: 2, c: 3 }, (value, key) => key === "c");
// => { a: 1, b: 2 }
```

```js [@tolki/data]
import { dataTakeUntil } from "@tolki/data";

dataTakeUntil([1, 2, 3, 4], 3);
// => [1, 2]

dataTakeUntil({ a: 1, b: 2, c: 3 }, (value) => value > 1);
// => { a: 1 }
```

:::

<FnTry label="dataTakeUntil" :fn="dataTakeUntil" :args="[
  { name: 'data', type: 'json', default: [1, 2, 3, 4] },
  { name: 'value', type: 'number', default: 3 },
]" />

### takeWhile

Take items from an array or object while the given condition is met. The condition is a value, matched strictly, or a callback.

Exported as `takeWhile` from `@tolki/arr` and `@tolki/obj`, and as `dataTakeWhile` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { takeWhile } from "@tolki/arr";

takeWhile([1, 1, 2, 2], 1);
// => [1, 1]

takeWhile([1, 2, 3, 4], (value) => value < 3);
// => [1, 2]

takeWhile([1, 2, 3, 4], 2);
// => []
```

```js [@tolki/obj]
import { takeWhile } from "@tolki/obj";

takeWhile({ a: 1, b: 1, c: 2 }, 1);
// => { a: 1, b: 1 }

takeWhile({ a: 1, b: 2, c: 3 }, (value) => value < 3);
// => { a: 1, b: 2 }
```

```js [@tolki/data]
import { dataTakeWhile } from "@tolki/data";

dataTakeWhile([1, 1, 2, 2], 1);
// => [1, 1]

dataTakeWhile({ a: 1, b: 2, c: 3 }, (value) => value < 3);
// => { a: 1, b: 2 }
```

:::

<FnTry label="dataTakeWhile" :fn="dataTakeWhile" :args="[
  { name: 'data', type: 'json', default: [1, 1, 2, 2] },
  { name: 'value', type: 'number', default: 1 },
]" />

### toCssClasses

Conditionally compile CSS classes into a class list. A plain entry is always kept. A `class: condition` entry is kept when its condition is true.

Exported as `toCssClasses` from `@tolki/arr` and `@tolki/obj`, and as `dataToCssClasses` from `@tolki/data`.

Laravel: [`Arr::toCssClasses()`](https://laravel.com/docs/helpers#method-array-to-css-classes)

::: code-group

```js [@tolki/arr]
import { toCssClasses } from "@tolki/arr";

toCssClasses(["font-bold", "mt-4"]);
// => "font-bold mt-4"

// An array can carry extra string keys alongside its list items.
toCssClasses(
  Object.assign(["font-bold", "mt-4"], { "ml-2": true, "mr-2": false }),
);
// => "font-bold mt-4 ml-2"
```

```js [@tolki/obj]
import { toCssClasses } from "@tolki/obj";

toCssClasses({ "p-4": true, "font-bold": true, "bg-red": false });
// => "p-4 font-bold"

toCssClasses({ 0: "font-bold", 1: "mt-4", "ml-2": true, "mr-2": false });
// => "font-bold mt-4 ml-2"
```

```js [@tolki/data]
import { dataToCssClasses } from "@tolki/data";

dataToCssClasses(["a", "b"]);
// => "a b"

dataToCssClasses({ "p-4": true, hidden: false });
// => "p-4"
```

:::

<FnTry label="dataToCssClasses" :fn="dataToCssClasses" :args="[
  { name: 'data', type: 'json', default: { 'p-4': true, 'font-bold': true, hidden: false } },
]" />

### toCssStyles

Conditionally compile CSS styles into a style list. Each style ends with a semicolon, and the styles are separated by a space.

Exported as `toCssStyles` from `@tolki/arr` and `@tolki/obj`, and as `dataToCssStyles` from `@tolki/data`.

Laravel: [`Arr::toCssStyles()`](https://laravel.com/docs/helpers#method-array-to-css-styles)

::: code-group

```js [@tolki/arr]
import { toCssStyles } from "@tolki/arr";

toCssStyles(["font-weight: bold", "margin-top: 4px"]);
// => "font-weight: bold; margin-top: 4px;"

toCssStyles(["font-weight: bold;", "margin-top: 4px"]);
// => "font-weight: bold; margin-top: 4px;"
```

```js [@tolki/obj]
import { toCssStyles } from "@tolki/obj";

toCssStyles({
  "font-weight: bold": true,
  "margin-left: 2px": true,
  "margin-right: 2px": false,
});
// => "font-weight: bold; margin-left: 2px;"
```

```js [@tolki/data]
import { dataToCssStyles } from "@tolki/data";

dataToCssStyles(["color: red"]);
// => "color: red;"

dataToCssStyles({ "color: red": true, "display: none": false });
// => "color: red;"
```

:::

<FnTry label="dataToCssStyles" :fn="dataToCssStyles" :args="[
  { name: 'data', type: 'json', default: { 'color: red': true, 'display: none': false } },
]" />

### undot

Expand a flat object with "dot" keys into a nested array or object.

Exported as `undot` from `@tolki/arr` and `@tolki/obj`, and as `dataUndot` from `@tolki/data`.

Laravel: [`Arr::undot()`](https://laravel.com/docs/helpers#method-array-undot)

::: code-group

```js [@tolki/arr]
import { undot } from "@tolki/arr";

// Every key segment must be a whole number, because the result is a list.
undot({ 0: "a", "1.0": "b", 1.1: "c" });
// => ["a", ["b", "c"]]
```

```js [@tolki/obj]
import { undot } from "@tolki/obj";

undot({ "user.name": "John", "user.age": 30 });
// => { user: { name: "John", age: 30 } }

undot({ "products.desk.price": 100, "products.desk.name": "Desk" });
// => { products: { desk: { price: 100, name: "Desk" } } }
```

```js [@tolki/data]
import { dataUndot } from "@tolki/data";

dataUndot({ "a.b": 1, "a.c": 2 });
// => { a: { b: 1, c: 2 } }

dataUndot({ 0: "a", "1.0": "b" });
// => { 0: "a", 1: ["b"] }
```

:::

<FnTry label="dataUndot" :fn="dataUndot" :args="[
  { name: 'data', type: 'json', default: { 'user.name': 'John', 'user.age': 30 } },
]" />

### union

Union arrays or objects into one. An earlier argument wins: a later one only adds the keys the result does not have yet.

Exported as `union` from `@tolki/arr` and `@tolki/obj`, and as `dataUnion` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { union } from "@tolki/arr";

// The union is by position, not by value: index 0 and 1 keep their first values.
union([1, 2], [3, 4, 5]);
// => [1, 2, 5]
```

```js [@tolki/obj]
import { union } from "@tolki/obj";

union({ a: 1, b: 2 }, { b: 3, c: 4 });
// => { a: 1, b: 2, c: 4 }

union({ a: 1 }, { a: 2, b: 2 }, { c: 3 });
// => { a: 1, b: 2, c: 3 }
```

```js [@tolki/data]
import { dataUnion } from "@tolki/data";

dataUnion({ a: 1 }, { a: 2, b: 3 });
// => { a: 1, b: 3 }

dataUnion([1, 2], [3, 4, 5]);
// => [1, 2, 5]
```

:::

<FnTry label="dataUnion" :fn="dataUnion" :args="[
  { name: 'data', type: 'json', default: { a: 1, b: 2 } },
  { name: 'other', type: 'json', default: { b: 3, c: 4 } },
]" />

### unshift

Prepend one or more items to the start of an array or object. It changes the data you pass in, unlike most functions on this page. See [Return values instead of references](./differences.md#return-values-instead-of-references).

Exported as `unshift` from `@tolki/arr` and `@tolki/obj`, and as `dataUnshift` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { unshift } from "@tolki/arr";

const queue = [3, 4];

unshift(queue, 1, 2);
// => [1, 2, 3, 4]

queue;
// => [1, 2, 3, 4]
```

```js [@tolki/obj]
import { unshift } from "@tolki/obj";

const stock = { b: 2 };

// Each new item goes under the next whole-number key.
unshift(stock, "x");
// => { 0: "x", b: 2 }

stock;
// => { 0: "x", b: 2 }
```

```js [@tolki/data]
import { dataUnshift } from "@tolki/data";

const queue = [3];

dataUnshift(queue, 1, 2);
// => [1, 2, 3]

queue;
// => [1, 2, 3]
```

:::

<FnTry label="dataUnshift" :fn="dataUnshift" :args="[
  { name: 'data', type: 'json', default: [3, 4] },
  { name: 'item', type: 'json', default: 1 },
]" />

### values

Get all the values of an array or object as a list.

Exported as `values` from `@tolki/arr` and `@tolki/obj`, and as `dataValues` from `@tolki/data`.

::: code-group

```js [@tolki/arr]
import { values } from "@tolki/arr";

values(["name", "age", "city"]);
// => ["name", "age", "city"]

values([]);
// => []
```

```js [@tolki/obj]
import { values } from "@tolki/obj";

values({ a: 1, b: 2 });
// => [1, 2]
```

```js [@tolki/data]
import { dataValues } from "@tolki/data";

dataValues({ a: 1, b: 2 });
// => [1, 2]

dataValues([1, 2]);
// => [1, 2]
```

:::

<FnTry label="dataValues" :fn="dataValues" :args="[
  { name: 'data', type: 'json', default: { a: 1, b: 2 } },
]" />

### where

Filter an array or object using the given callback. A list comes back renumbered from 0; see [Behaviour differences](./differences.md#behaviour-differences).

Exported as `where` from `@tolki/arr` and `@tolki/obj`, and as `dataWhere` from `@tolki/data`.

Laravel: [`Arr::where()`](https://laravel.com/docs/helpers#method-array-where)

::: code-group

```js [@tolki/arr]
import { where } from "@tolki/arr";

where([1, 2, 3, 4], (value) => value > 2);
// => [3, 4]

where([1, 2, 3, 4], (value, index) => index % 2 === 1);
// => [2, 4]
```

```js [@tolki/obj]
import { where } from "@tolki/obj";

where({ a: 1, b: 2, c: 3 }, (value) => value > 1);
// => { b: 2, c: 3 }

where({ a: 1, b: 2, c: 3 }, (value, key) => key !== "b");
// => { a: 1, c: 3 }
```

```js [@tolki/data]
import { dataWhere } from "@tolki/data";

dataWhere([1, 2, 3], (value) => value > 1);
// => [2, 3]

dataWhere({ a: 1, b: 2, c: 3 }, (value) => value > 1);
// => { b: 2, c: 3 }
```

:::

<FnTry label="dataWhere" :fn="dataWhere" :args="[
  { name: 'data', type: 'json', default: { a: 1, b: 2, c: 3 } },
  { name: 'callback', type: 'select', default: predicates[0].value, options: predicates },
]" />

### whereNotNull

Filter an array or object, removing the items whose value is `null`. A list comes back renumbered from 0; see [Behaviour differences](./differences.md#behaviour-differences).

Exported as `whereNotNull` from `@tolki/arr` and `@tolki/obj`, and as `dataWhereNotNull` from `@tolki/data`.

Laravel: [`Arr::whereNotNull()`](https://laravel.com/docs/helpers#method-array-where-not-null)

::: code-group

```js [@tolki/arr]
import { whereNotNull } from "@tolki/arr";

whereNotNull(["a", null, "b", null]);
// => ["a", "b"]

// Only null is removed; an undefined item stays.
whereNotNull([1, null, 2, undefined, 3]);
// => [1, 2, undefined, 3]
```

```js [@tolki/obj]
import { whereNotNull } from "@tolki/obj";

whereNotNull({ a: 1, b: null, c: 3 });
// => { a: 1, c: 3 }
```

```js [@tolki/data]
import { dataWhereNotNull } from "@tolki/data";

dataWhereNotNull([1, null, 3]);
// => [1, 3]

dataWhereNotNull({ a: 1, b: null, c: 3 });
// => { a: 1, c: 3 }
```

:::

<FnTry label="dataWhereNotNull" :fn="dataWhereNotNull" :args="[
  { name: 'data', type: 'json', default: { a: 1, b: null, c: 3 } },
]" />

### wrap

If the given value is not already an array (an object, with `@tolki/obj`), wrap it in one. `null` gives an empty result.

Exported as `wrap` from `@tolki/arr` and `@tolki/obj`. `@tolki/data` has no `wrap`.

Laravel: [`Arr::wrap()`](https://laravel.com/docs/helpers#method-array-wrap)

::: code-group

```js [@tolki/arr]
import { wrap } from "@tolki/arr";

wrap("hello");
// => ["hello"]

wrap(["hello"]);
// => ["hello"]

wrap(null);
// => []
```

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

:::

<FnTry label="wrap" :fn="wrap" :args="[
  { name: 'value', type: 'json', default: 'hello' },
]" />
