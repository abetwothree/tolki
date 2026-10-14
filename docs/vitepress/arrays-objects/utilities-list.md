# Tolki Array & Object Utilities List

<script setup>
import { accessible, arrayable } from "@tolki/arr";
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
} from "@tolki/data";

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
</script>

These utilities work on arrays with `@tolki/arr`, on plain objects with `@tolki/obj`, and on either one with `@tolki/data`. Every section has a tab for each package that exports the function, and the page remembers the tab you pick, so the next visit starts on the same one.

## Utilities List

<div class="collection-method-list" markdown="1">

[accessible](#accessible) [add](#add) [after](#after) [arrayable](#arrayable) [arrayItem](#arrayitem) [before](#before) [boolean](#boolean) [chunk](#chunk) [chunkBy](#chunkby) [chunkWhile](#chunkwhile) [collapse](#collapse) [combine](#combine) [contains](#contains) [containsStrict](#containsstrict) [count](#count) [crossJoin](#crossjoin) [diff](#diff) [diffAssoc](#diffassoc) [diffAssocUsing](#diffassocusing) [diffKeys](#diffkeys) [diffKeysUsing](#diffkeysusing) [diffUsing](#diffusing) [divide](#divide) [dot](#dot) [every](#every)

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
