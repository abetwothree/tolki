# Tolki Collection Methods List

<script setup>
import { collect, Collection } from "@tolki/collection";

// Callback arguments cannot be typed into a field, so the playground offers presets.
const chunkByCallbacks = [
  { label: "the value itself", value: (v) => v },
  { label: "v is even", value: (v) => v % 2 === 0 },
];

const chunkWhileCallbacks = [
  {
    label: "same as the last in the chunk",
    value: (v, k, chunk) => chunk.last() === v,
  },
  {
    label: "one more than the last in the chunk",
    value: (v, k, chunk) => chunk.last() + 1 === v,
  },
];

const countByCallbacks = [
  { label: "the value itself", value: (v) => v },
  { label: "even or odd", value: (v) => (v % 2 === 0 ? "even" : "odd") },
];

const comparators = [
  {
    label: "ignoring case",
    value: (a, b) => (String(a).toLowerCase() === String(b).toLowerCase() ? 0 : 1),
  },
  { label: "exactly equal", value: (a, b) => (a === b ? 0 : 1) },
];
</script>

These are the methods of the `Collection` class. Every example builds a collection with [`collect()`](./index.md#creating-collections) and reads the items back with `all()` or `toArray()`. Each section ends with a box you can edit to try the method.

## Methods List

<div class="collection-method-list" markdown="1">

[add](#add) [after](#after) [all](#all) [average](#average) [avg](#avg) [before](#before) [chunk](#chunk) [chunkBy](#chunkby) [chunkWhile](#chunkwhile) [collapse](#collapse) [collapseWithKeys](#collapsewithkeys) [collect](#collect) [combine](#combine) [concat](#concat) [contains](#contains) [containsManyItems](#containsmanyitems) [containsOneItem](#containsoneitem) [containsStrict](#containsstrict) [count](#count) [countBy](#countby) [crossJoin](#crossjoin) [diff](#diff) [diffAssoc](#diffassoc) [diffAssocUsing](#diffassocusing) [diffKeys](#diffkeys) [diffKeysUsing](#diffkeysusing) [diffUsing](#diffusing) [doesntContain](#doesntcontain) [doesntContainStrict](#doesntcontainstrict) [dot](#dot)

</div>

## Methods Details

### add

Add an item to the end of the collection, under the next free integer key.

The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#add).

::: warning
Unlike most other collection methods, `add` does not return a new modified collection; it modifies and returns the collection it is called on.
:::

```js
import { collect } from "@tolki/collection";

const items = collect([1, 2]);

items.add(3).all();
// => [1, 2, 3]

items.all();
// => [1, 2, 3]

collect({ 5: "a" }).add("z").all();
// => { 5: "a", 6: "z" }
```

<FnTry label="collect(items).add(item)" :fn="(items, item) => collect(items).add(item).all()" :args="[
  { name: 'items', type: 'json', default: [1, 2] },
  { name: 'item', type: 'json', default: 3 },
]" />

### after

Get the item after the given item, or `null` when the item is not found or is the last one.

Laravel: [`after()`](https://laravel.com/docs/collections#method-after)

The search is loose by default, so `"4"` finds `4` (see [Loose and strict comparison](../arrays-objects/php-semantics.md#loose-and-strict-comparison)). Pass `true` as the second argument to compare strictly, or pass a callback to find the first item that passes a test.

The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#after).

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3, 4, 5]).after(3);
// => 4

collect([1, 2, 3, 4, 5]).after(5);
// => null

collect([2, 4, 6, 8]).after("4");
// => 6

collect([2, 4, 6, 8]).after("4", true);
// => null

collect([2, 4, 6, 8]).after((item, key) => item > 5);
// => 8
```

<FnTry label="collect(items).after(value, strict)" :fn="(items, value, strict) => collect(items).after(value, strict)" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3, 4, 5] },
  { name: 'value', type: 'json', default: 3 },
  { name: 'strict', type: 'boolean', default: false },
]" />

### all

Get the items of the collection: an array for a list, a plain object for a keyed collection.

Laravel: [`all()`](https://laravel.com/docs/collections#method-all)

`all()` hands back the collection's own items, not a copy. See [Values](./differences.md#values) in the differences.

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3]).all();
// => [1, 2, 3]

collect({ a: 1, b: 2 }).all();
// => { a: 1, b: 2 }
```

<FnTry label="collect(items).all()" :fn="(items) => collect(items).all()" :args="[
  { name: 'items', type: 'json', default: { a: 1, b: 2 } },
]" />

### average

Alias for the [avg](#avg) method.

Laravel: [`average()`](https://laravel.com/docs/collections#method-average)

```js
import { collect } from "@tolki/collection";

collect([1, 1, 2, 4]).average();
// => 2
```

<FnTry label="collect(items).average(key)" :fn="(items, key) => collect(items).average(key)" :args="[
  { name: 'items', type: 'json', default: [{ foo: 10 }, { foo: 10 }, { foo: 20 }, { foo: 40 }] },
  { name: 'key', type: 'json', default: 'foo' },
]" />

### avg

Get the average value of a given key, or of the items themselves when no key is given. Items that are `null` are left out, and an empty collection gives `null`.

Laravel: [`avg()`](https://laravel.com/docs/collections#method-avg)

The callback also receives the key as its second argument (see [JavaScript-only additions](./differences.md#javascript-only-additions)). Numeric strings are added as numbers, and a value that cannot be added, such as a non-numeric string or an array, throws a `TypeError`.

```js
import { collect } from "@tolki/collection";

collect([{ foo: 10 }, { foo: 10 }, { foo: 20 }, { foo: 40 }]).avg("foo");
// => 20

collect([1, 1, 2, 4]).avg();
// => 2

collect([10, 20, 30]).avg((value, key) => value + key);
// => 21

collect(["1", "2", 3]).avg();
// => 2

collect([]).avg();
// => null

collect(["a", 1]).avg();
// => throws TypeError
```

<FnTry label="collect(items).avg(key)" :fn="(items, key) => collect(items).avg(key)" :args="[
  { name: 'items', type: 'json', default: [{ foo: 10 }, { foo: 10 }, { foo: 20 }, { foo: 40 }] },
  { name: 'key', type: 'json', default: 'foo' },
]" />

### before

Get the item before the given item, or `null` when the item is not found or is the first one. It is the opposite of [after](#after) and takes the same arguments.

Laravel: [`before()`](https://laravel.com/docs/collections#method-before)

The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#before).

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3, 4, 5]).before(3);
// => 2

collect([1, 2, 3, 4, 5]).before(1);
// => null

collect([2, 4, 6, 8]).before("4", true);
// => null

collect([2, 4, 6, 8]).before((item, key) => item > 5);
// => 4
```

<FnTry label="collect(items).before(value, strict)" :fn="(items, value, strict) => collect(items).before(value, strict)" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3, 4, 5] },
  { name: 'value', type: 'json', default: 3 },
  { name: 'strict', type: 'boolean', default: false },
]" />

### chunk

Break the collection into multiple, smaller collections of a given size.

Laravel: [`chunk()`](https://laravel.com/docs/collections#method-chunk)

Each chunk keeps its items' keys, so a later chunk of a list starts at its original position. Pass `false` as the second argument to renumber each chunk from 0. A size of 0 or below gives an empty collection.

The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#chunk).

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3, 4, 5]).chunk(2).toArray();
// => [{ 0: 1, 1: 2 }, { 2: 3, 3: 4 }, { 4: 5 }]

collect([1, 2, 3, 4, 5]).chunk(2, false).toArray();
// => [[1, 2], [3, 4], [5]]

collect({ a: 1, b: 2, c: 3 }).chunk(2).toArray();
// => [{ a: 1, b: 2 }, { c: 3 }]
```

<FnTry label="collect(items).chunk(size)" :fn="(items, size) => collect(items).chunk(size).toArray()" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3, 4, 5] },
  { name: 'size', type: 'number', default: 2 },
]" />

### chunkBy

Break the collection into chunks of adjacent items that share the same value for a key or callback.

Laravel: [`chunkBy()`](https://laravel.com/docs/collections#method-chunkby)

Unlike `groupBy`, items with the same value that are not next to each other land in separate chunks. A key may be a [dot-notation](../arrays-objects/dot-notation.md) path, and values are compared loosely, so `1` and `"1"` share a chunk (see [Loose and strict comparison](../arrays-objects/php-semantics.md#loose-and-strict-comparison)).

<!-- docs/php-parity/Collection/chunkBy.json, "chunkBy with a callback" -->

::: info
A list's chunks are lists, so each one counts from 0 again. In Laravel a later chunk keeps the keys its items had.
:::

The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#chunkby).

```js
import { collect } from "@tolki/collection";

collect([1, 1, 2, 2, 1])
  .chunkBy((value) => value)
  .toArray();
// => [[1, 1], [2, 2], [1]]

collect([{ parent: "a" }, { parent: "a" }, { parent: "b" }])
  .chunkBy("parent")
  .toArray();
// => [[{ parent: "a" }, { parent: "a" }], [{ parent: "b" }]]

collect([1, "1", 2])
  .chunkBy((value) => value)
  .toArray();
// => [[1, "1"], [2]]
```

<FnTry label="collect(items).chunkBy(callback)" :fn="(items, callback) => collect(items).chunkBy(callback).toArray()" :args="[
  { name: 'items', type: 'json', default: [1, 1, 2, 2, 1] },
  { name: 'callback', type: 'select', default: chunkByCallbacks[0].value, options: chunkByCallbacks },
]" />

### chunkWhile

Break the collection into chunks with a callback that decides whether the next item joins the current chunk.

Laravel: [`chunkWhile()`](https://laravel.com/docs/collections#method-chunkwhile)

The callback receives the value, its key and the chunk built so far as a collection, so `chunk.last()` works. Return `true` to keep adding to the chunk.

<!-- docs/php-parity/Collection/chunkWhile.json, "chunkWhile on equal adjacent elements" -->

::: info
A list's chunks are lists, so each one counts from 0 again. In Laravel a later chunk keeps the keys its items had.
:::

The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#chunkwhile).

```js
import { collect } from "@tolki/collection";

collect("AABBCCCD".split(""))
  .chunkWhile((value, key, chunk) => value === chunk.last())
  .toArray();
// => [["A", "A"], ["B", "B"], ["C", "C", "C"], ["D"]]

collect([1, 2, 4, 5, 7])
  .chunkWhile((value, key, chunk) => value === chunk.last() + 1)
  .toArray();
// => [[1, 2], [4, 5], [7]]
```

<FnTry label="collect(items).chunkWhile(callback)" :fn="(items, callback) => collect(items).chunkWhile(callback).toArray()" :args="[
  { name: 'items', type: 'json', default: ['A', 'A', 'B', 'B', 'C', 'C', 'C', 'D'] },
  { name: 'callback', type: 'select', default: chunkWhileCallbacks[0].value, options: chunkWhileCallbacks },
]" />

### collapse

Collapse a collection of arrays, objects or collections into a single, flat collection.

Laravel: [`collapse()`](https://laravel.com/docs/collections#method-collapse)

Arrays join into a list, and objects merge into a keyed collection. To keep each item's keys, use [collapseWithKeys](#collapsewithkeys). The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#collapse).

```js
import { collect } from "@tolki/collection";

collect([
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
])
  .collapse()
  .all();
// => [1, 2, 3, 4, 5, 6, 7, 8, 9]

collect([{ a: 1 }, { b: 2 }])
  .collapse()
  .all();
// => { a: 1, b: 2 }

collect([collect([1, 2]), collect([3])])
  .collapse()
  .all();
// => [1, 2, 3]
```

<FnTry label="collect(items).collapse()" :fn="(items) => collect(items).collapse().all()" :args="[
  { name: 'items', type: 'json', default: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] },
]" />

### collapseWithKeys

Collapse a collection of arrays, objects or collections into one collection, keeping the keys. A later item's key replaces an earlier one's.

Laravel: [`collapseWithKeys()`](https://laravel.com/docs/collections#method-collapsewithkeys)

A flat collection collapses to an empty one.

```js
import { collect } from "@tolki/collection";

collect([
  { first: collect([1, 2, 3]) },
  { second: [4, 5, 6] },
  { third: collect([7, 8, 9]) },
])
  .collapseWithKeys()
  .toArray();
// => { first: [1, 2, 3], second: [4, 5, 6], third: [7, 8, 9] }

collect([{ a: 1 }, { b: 2 }, { a: 3 }])
  .collapseWithKeys()
  .all();
// => { a: 3, b: 2 }

collect([1, 2, 3]).collapseWithKeys().all();
// => []
```

<FnTry label="collect(items).collapseWithKeys()" :fn="(items) => collect(items).collapseWithKeys().all()" :args="[
  { name: 'items', type: 'json', default: [{ a: 1 }, { b: 2 }, { a: 3 }] },
]" />

### collect

Get a new collection holding a copy of the items.

Laravel: [`collect()`](https://laravel.com/docs/collections#method-collect)

This is the `collect` method of a collection. The [`collect()` function](./index.md#creating-collections) that builds a collection from an array is a separate helper.

```js
import { collect } from "@tolki/collection";

const original = collect([1, 2, 3]);
const copy = original.collect();

copy.add(4).all();
// => [1, 2, 3, 4]

original.all();
// => [1, 2, 3]
```

<FnTry label="collect(items).collect()" :fn="(items) => collect(items).collect().all()" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3] },
]" />

### combine

Combine the values of the collection, as keys, with the values of another array or collection.

Laravel: [`combine()`](https://laravel.com/docs/collections#method-combine)

The collection's own keys are not used. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#combine).

```js
import { collect } from "@tolki/collection";

collect(["name", "age"]).combine(["George", 29]).all();
// => { name: "George", age: 29 }
```

<FnTry label="collect(items).combine(values)" :fn="(items, values) => collect(items).combine(values).all()" :args="[
  { name: 'items', type: 'json', default: ['name', 'age'] },
  { name: 'values', type: 'json', default: ['George', 29] },
]" />

### concat

Append the values of an array, object or collection onto the end of the collection.

Laravel: [`concat()`](https://laravel.com/docs/collections#method-concat)

The appended values get new integer keys, even when they came from a keyed source. To keep keys, use `merge()`.

```js
import { collect } from "@tolki/collection";

collect(["John Doe"]).concat(["Jane Doe"]).concat({ name: "Johnny Doe" }).all();
// => ["John Doe", "Jane Doe", "Johnny Doe"]

collect({ a: 1, b: 2 }).concat({ c: 3, d: 4 }).all();
// => { 0: 3, 1: 4, a: 1, b: 2 }
```

<FnTry label="collect(items).concat(other)" :fn="(items, other) => collect(items).concat(other).all()" :args="[
  { name: 'items', type: 'json', default: ['John Doe'] },
  { name: 'other', type: 'json', default: ['Jane Doe'] },
]" />

### contains

Determine whether the collection contains a given item.

Laravel: [`contains()`](https://laravel.com/docs/collections#method-contains)

Pass a callback to test each item, a value to look for, or a key and a value to look for a matching pair in the items. Comparisons are loose, so `"2"` matches `2` (see [Loose and strict comparison](../arrays-objects/php-semantics.md#loose-and-strict-comparison)). Use [containsStrict](#containsstrict) to compare strictly, and [doesntContain](#doesntcontain) for the opposite. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#contains).

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3, 4, 5]).contains((value, key) => value > 5);
// => false

collect({ name: "Desk", price: 100 }).contains("Desk");
// => true

collect({ name: "Desk", price: 100 }).contains("New York");
// => false

collect([
  { product: "Desk", price: 200 },
  { product: "Chair", price: 100 },
]).contains("product", "Bookcase");
// => false

collect([1, 2, 3]).contains("2");
// => true
```

<FnTry label="collect(items).contains(value)" :fn="(items, value) => collect(items).contains(value)" :args="[
  { name: 'items', type: 'json', default: { name: 'Desk', price: 100 } },
  { name: 'value', type: 'json', default: 'Desk' },
]" />

### containsManyItems

Determine whether the collection holds more than one item, or, with a callback, whether more than one item passes the test.

Deprecated: use `hasMany()` instead.

```js
import { collect } from "@tolki/collection";

collect([1, 2]).containsManyItems();
// => true

collect([1]).containsManyItems();
// => false

collect([1, 2, 2]).containsManyItems((value) => value === 2);
// => true
```

<FnTry label="collect(items).containsManyItems()" :fn="(items) => collect(items).containsManyItems()" :args="[
  { name: 'items', type: 'json', default: [1, 2] },
]" />

### containsOneItem

Determine whether the collection holds exactly one item, or, with a callback, whether exactly one item passes the test.

Deprecated: use `hasSole()` instead.

```js
import { collect } from "@tolki/collection";

collect([1]).containsOneItem();
// => true

collect([]).containsOneItem();
// => false

collect([1, 2, 3]).containsOneItem((value) => value >= 2);
// => false

collect([1, 2, 3]).containsOneItem((value) => value < 2);
// => true
```

<FnTry label="collect(items).containsOneItem()" :fn="(items) => collect(items).containsOneItem()" :args="[
  { name: 'items', type: 'json', default: [1] },
]" />

### containsStrict

Determine whether the collection contains a given item, comparing strictly.

Laravel: [`containsStrict()`](https://laravel.com/docs/collections#method-containsstrict)

It takes the same arguments as [contains](#contains), but `"2"` does not match `2`. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#containsstrict).

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3]).containsStrict(2);
// => true

collect([1, 2, 3]).containsStrict("2");
// => false

collect([{ id: 1 }]).containsStrict("id", 1);
// => true

collect([{ id: 1 }]).containsStrict("id", "1");
// => false
```

<FnTry label="collect(items).containsStrict(value)" :fn="(items, value) => collect(items).containsStrict(value)" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3] },
  { name: 'value', type: 'json', default: '2' },
]" />

### count

Get the total number of items in the collection.

Laravel: [`count()`](https://laravel.com/docs/collections#method-count)

The `length` property gives the same number. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#count).

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3, 4]).count();
// => 4

collect({ a: 1, b: 2 }).count();
// => 2

collect([]).count();
// => 0
```

<FnTry label="collect(items).count()" :fn="(items) => collect(items).count()" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3, 4] },
]" />

### countBy

Count the occurrences of values in the collection, by the value itself, a key or a callback.

Laravel: [`countBy()`](https://laravel.com/docs/collections#method-countBy)

The result is a keyed collection of counts. An `@tolki/enum` case counts as its value (see [JavaScript-only additions](./differences.md#javascript-only-additions)).

```js
import { collect } from "@tolki/collection";

collect([1, 2, 2, 2, 3]).countBy().all();
// => { 1: 1, 2: 3, 3: 1 }

collect(["alice@gmail.com", "bob@yahoo.com", "carlos@gmail.com"])
  .countBy((email) => email.split("@")[1])
  .all();
// => { "gmail.com": 2, "yahoo.com": 1 }

collect([{ type: "a" }, { type: "b" }, { type: "a" }])
  .countBy("type")
  .all();
// => { a: 2, b: 1 }
```

<FnTry label="collect(items).countBy(callback)" :fn="(items, callback) => collect(items).countBy(callback).all()" :args="[
  { name: 'items', type: 'json', default: [1, 2, 2, 2, 3] },
  { name: 'callback', type: 'select', default: countByCallbacks[0].value, options: countByCallbacks },
]" />

### crossJoin

Cross join the collection's values among the given arrays or collections, returning every possible combination.

Laravel: [`crossJoin()`](https://laravel.com/docs/collections#method-crossjoin)

Keys are ignored: each list contributes its values. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#crossjoin).

```js
import { collect } from "@tolki/collection";

collect([1, 2]).crossJoin(["a", "b"]).all();
// => [[1, "a"], [1, "b"], [2, "a"], [2, "b"]]

collect([1, 2]).crossJoin(["a", "b"], ["I", "II"]).all();
// => [
//   [1, "a", "I"], [1, "a", "II"], [1, "b", "I"], [1, "b", "II"],
//   [2, "a", "I"], [2, "a", "II"], [2, "b", "I"], [2, "b", "II"],
// ]
```

<FnTry label="collect(items).crossJoin(other)" :fn="(items, other) => collect(items).crossJoin(other).all()" :args="[
  { name: 'items', type: 'json', default: [1, 2] },
  { name: 'other', type: 'json', default: ['a', 'b'] },
]" />

### diff

Get the values in the collection that are not present in the given array or collection.

Laravel: [`diff()`](https://laravel.com/docs/collections#method-diff)

Keys are kept. Values are compared as strings, so `2` matches `"2"`. Array and object items are matched by identity: see [Differences from Laravel](./differences.md#values). The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#diff).

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3, 4, 5]).diff([2, 4, 6, 8]).all();
// => [1, 3, 5]

collect({ a: 1, b: 2, c: 3 }).diff([2]).all();
// => { a: 1, c: 3 }

collect([1, 2, 3]).diff(["2"]).all();
// => [1, 3]
```

<FnTry label="collect(items).diff(other)" :fn="(items, other) => collect(items).diff(other).all()" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3, 4, 5] },
  { name: 'other', type: 'json', default: [2, 4, 6, 8] },
]" />

### diffAssoc

Get the key and value pairs in the collection that are not present in the given array or collection.

Laravel: [`diffAssoc()`](https://laravel.com/docs/collections#method-diffassoc)

A pair is left out only when both its key and its value match. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#diffassoc).

```js
import { collect } from "@tolki/collection";

collect({ color: "orange", type: "fruit", remain: 6 })
  .diffAssoc({ color: "yellow", type: "fruit", remain: 3, used: 6 })
  .all();
// => { color: "orange", remain: 6 }
```

<FnTry label="collect(items).diffAssoc(other)" :fn="(items, other) => collect(items).diffAssoc(other).all()" :args="[
  { name: 'items', type: 'json', default: { color: 'orange', type: 'fruit', remain: 6 } },
  { name: 'other', type: 'json', default: { color: 'yellow', type: 'fruit', remain: 3, used: 6 } },
]" />

### diffAssocUsing

Get the key and value pairs that are not present in the given items, comparing keys with a callback of your own.

Laravel: [`diffAssocUsing()`](https://laravel.com/docs/collections#method-diffassocusing)

The callback receives two keys and answers `0`, or `true`, when they match. Values are still compared strictly. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#diffassocusing).

```js
import { collect } from "@tolki/collection";

const ignoreCase = (a, b) =>
  String(a).toLowerCase() === String(b).toLowerCase() ? 0 : 1;

collect({ color: "orange", type: "fruit", remain: 6 })
  .diffAssocUsing({ Color: "yellow", Type: "fruit", Remain: 3 }, ignoreCase)
  .all();
// => { color: "orange", remain: 6 }
```

<FnTry label="collect(items).diffAssocUsing(other, callback)" :fn="(items, other, callback) => collect(items).diffAssocUsing(other, callback).all()" :args="[
  { name: 'items', type: 'json', default: { color: 'orange', type: 'fruit', remain: 6 } },
  { name: 'other', type: 'json', default: { Color: 'yellow', Type: 'fruit', Remain: 3 } },
  { name: 'callback', type: 'select', default: comparators[0].value, options: comparators },
]" />

### diffKeys

Get the key and value pairs in the collection whose keys are not present in the given array or collection.

Laravel: [`diffKeys()`](https://laravel.com/docs/collections#method-diffkeys)

Values are ignored. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#diffkeys).

```js
import { collect } from "@tolki/collection";

collect({ one: 10, two: 20, three: 30, four: 40, five: 50 })
  .diffKeys({ two: 2, four: 4, six: 6, eight: 8 })
  .all();
// => { one: 10, three: 30, five: 50 }

collect([1, 3, 5, 7, 8]).diffKeys([1, 3, 5]).all();
// => [7, 8]
```

<FnTry label="collect(items).diffKeys(other)" :fn="(items, other) => collect(items).diffKeys(other).all()" :args="[
  { name: 'items', type: 'json', default: { one: 10, two: 20, three: 30 } },
  { name: 'other', type: 'json', default: { two: 2, six: 6 } },
]" />

### diffKeysUsing

Get the key and value pairs whose keys are not present in the given items, comparing keys with a callback of your own.

The callback receives two keys and answers `0`, or `true`, when they match. Values are ignored. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#diffkeysusing).

```js
import { collect } from "@tolki/collection";

const ignoreCase = (a, b) =>
  String(a).toLowerCase() === String(b).toLowerCase() ? 0 : 1;

collect({ id: 1, first_word: "Hello" })
  .diffKeysUsing({ ID: 123, foo_bar: "Hello" }, ignoreCase)
  .all();
// => { first_word: "Hello" }
```

<FnTry label="collect(items).diffKeysUsing(other, callback)" :fn="(items, other, callback) => collect(items).diffKeysUsing(other, callback).all()" :args="[
  { name: 'items', type: 'json', default: { id: 1, first_word: 'Hello' } },
  { name: 'other', type: 'json', default: { ID: 123, foo_bar: 'Hello' } },
  { name: 'callback', type: 'select', default: comparators[0].value, options: comparators },
]" />

### diffUsing

Get the values in the collection that are not present in the given items, comparing values with a callback of your own.

The callback receives two values and answers `0`, or `true`, when they match. Keys are kept. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#diffusing).

```js
import { collect } from "@tolki/collection";

const ignoreCase = (a, b) =>
  String(a).toLowerCase() === String(b).toLowerCase() ? 0 : 1;

collect(["Green", "Brown", "Blue"])
  .diffUsing(["GREEN", "Yellow"], ignoreCase)
  .all();
// => ["Brown", "Blue"]

collect(["Green", "Brown", "Blue"])
  .diffUsing(["GREEN", "Yellow"], (a, b) => a.toLowerCase() === b.toLowerCase())
  .all();
// => ["Brown", "Blue"]
```

<FnTry label="collect(items).diffUsing(other, callback)" :fn="(items, other, callback) => collect(items).diffUsing(other, callback).all()" :args="[
  { name: 'items', type: 'json', default: ['Green', 'Brown', 'Blue'] },
  { name: 'other', type: 'json', default: ['GREEN', 'Yellow'] },
  { name: 'callback', type: 'select', default: comparators[0].value, options: comparators },
]" />

### doesntContain

Determine whether the collection does not contain a given item.

Laravel: [`doesntContain()`](https://laravel.com/docs/collections#method-doesntcontain)

It takes the same arguments as [contains](#contains) and gives the opposite answer. Comparisons are loose, so `"2"` matches `2`.

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3, 4, 5]).doesntContain((value, key) => value < 5);
// => false

collect({ name: "Desk", price: 100 }).doesntContain("Table");
// => true

collect({ name: "Desk", price: 100 }).doesntContain("Desk");
// => false

collect([{ product: "Desk" }, { product: "Chair" }]).doesntContain(
  "product",
  "Bookcase",
);
// => true
```

<FnTry label="collect(items).doesntContain(value)" :fn="(items, value) => collect(items).doesntContain(value)" :args="[
  { name: 'items', type: 'json', default: { name: 'Desk', price: 100 } },
  { name: 'value', type: 'json', default: 'Table' },
]" />

### doesntContainStrict

Determine whether the collection does not contain a given item, comparing strictly.

Laravel: [`doesntContainStrict()`](https://laravel.com/docs/collections#method-doesntcontainstrict)

It takes the same arguments as [doesntContain](#doesntcontain), but `"2"` does not match `2`.

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3]).doesntContainStrict(4);
// => true

collect([1, 2, 3]).doesntContainStrict(2);
// => false

collect([1, 2, 3]).doesntContainStrict("2");
// => true
```

<FnTry label="collect(items).doesntContainStrict(value)" :fn="(items, value) => collect(items).doesntContainStrict(value)" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3] },
  { name: 'value', type: 'json', default: '2' },
]" />

### dot

Flatten a multi-dimensional collection into a single level that uses "dot" notation to show depth.

Laravel: [`dot()`](https://laravel.com/docs/collections#method-dot)

Pass a depth to stop flattening early. The keys follow the rules in [Dot Notation](../arrays-objects/dot-notation.md). The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#dot).

```js
import { collect } from "@tolki/collection";

collect({ products: { desk: { price: 100 } } })
  .dot()
  .all();
// => { "products.desk.price": 100 }

collect([{ a: 1 }, { b: { c: 2 } }])
  .dot()
  .all();
// => { "0.a": 1, "1.b.c": 2 }

collect({ a: { b: { c: 1 } } })
  .dot(1)
  .all();
// => { "a.b": { c: 1 } }
```

<FnTry label="collect(items).dot()" :fn="(items) => collect(items).dot().all()" :args="[
  { name: 'items', type: 'json', default: { products: { desk: { price: 100 } } } },
]" />
