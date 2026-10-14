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

const predicates = [
  { label: "greater than 2", value: (v) => v > 2 },
  { label: "greater than 0", value: (v) => v > 0 },
  { label: "is even", value: (v) => v % 2 === 0 },
  { label: "greater than 5", value: (v) => v > 5 },
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

[add](#add) [after](#after) [all](#all) [average](#average) [avg](#avg) [before](#before) [chunk](#chunk) [chunkBy](#chunkby) [chunkWhile](#chunkwhile) [collapse](#collapse) [collapseWithKeys](#collapsewithkeys) [collect](#collect) [combine](#combine) [concat](#concat) [contains](#contains) [containsManyItems](#containsmanyitems) [containsOneItem](#containsoneitem) [containsStrict](#containsstrict) [count](#count) [countBy](#countby) [crossJoin](#crossjoin) [diff](#diff) [diffAssoc](#diffassoc) [diffAssocUsing](#diffassocusing) [diffKeys](#diffkeys) [diffKeysUsing](#diffkeysusing) [diffUsing](#diffusing) [doesntContain](#doesntcontain) [doesntContainStrict](#doesntcontainstrict) [dot](#dot) [dump](#dump) [duplicates](#duplicates) [duplicatesStrict](#duplicatesstrict) [each](#each) [eachSpread](#eachspread) [empty](#empty) [ensure](#ensure) [escapeWhenCastingToString](#escapewhencastingtostring) [every](#every) [except](#except) [filter](#filter) [first](#first) [firstOrFail](#firstorfail) [firstWhere](#firstwhere) [flatMap](#flatmap) [flatten](#flatten) [flip](#flip) [forget](#forget) [forPage](#forpage) [fromJson](#fromjson) [get](#get) [getIterator](#getiterator) [getOrPut](#getorput) [groupBy](#groupby) [has](#has) [hasAny](#hasany) [hasMany](#hasmany) [hasSole](#hassole) [implode](#implode) [intersect](#intersect)

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

### dump

Dump the collection's items to the console, along with any further values you pass, and return the collection.

Laravel: [`dump()`](https://laravel.com/docs/collections#method-dump)

`dump()` logs the items with `console.log`, so the example below logs the two names to the console. Because it returns the collection, you can drop it into the middle of a chain. There is no `dd()`: see [Not portable](./differences.md#not-portable).

```js
import { collect } from "@tolki/collection";

collect(["John Doe", "Jane Doe"]).dump().all();
// => ["John Doe", "Jane Doe"]

collect([1, 2, 3])
  .dump("after the dump")
  .map((value) => value * 2)
  .all();
// => [2, 4, 6]
```

### duplicates

Get the values that appear more than once, each under the key of its second and later appearances.

Laravel: [`duplicates()`](https://laravel.com/docs/collections#method-duplicates)

<!-- docs/php-parity/Collection/duplicates.json, "C32-D-duplicates-list-first-key" -->

The keys are the positions of the repeated values, as in [chunk](#chunk), because the keys are the answer. See [Keys and order](./differences.md#keys-and-order). Pass a key, or a callback, to check the values it reads from each item; the result holds those values. Values are compared loosely, so `1` and `"1"` are duplicates (see [Loose and strict comparison](../arrays-objects/php-semantics.md#loose-and-strict-comparison)). Use [duplicatesStrict](#duplicatesstrict) to compare strictly.

```js
import { collect } from "@tolki/collection";

collect(["a", "b", "a", "c", "b"]).duplicates().all();
// => { 2: "a", 4: "b" }

collect([
  { email: "abigail@example.com", position: "Developer" },
  { email: "james@example.com", position: "Designer" },
  { email: "victoria@example.com", position: "Developer" },
])
  .duplicates("position")
  .all();
// => { 2: "Developer" }

collect([1, "1", 2]).duplicates().all();
// => { 1: "1" }
```

<FnTry label="collect(items).duplicates(key)" :fn="(items, key) => collect(items).duplicates(key || null).all()" :args="[
  { name: 'items', type: 'json', default: ['a', 'b', 'a', 'c', 'b'] },
  { name: 'key', type: 'string', default: '' },
]" />

### duplicatesStrict

Get the values that appear more than once, comparing strictly.

Laravel: [`duplicatesStrict()`](https://laravel.com/docs/collections#method-duplicatesstrict)

It takes the same arguments as [duplicates](#duplicates), but `"1"` does not match `1`.

```js
import { collect } from "@tolki/collection";

collect([1, "1", 2, "2", 2]).duplicatesStrict().all();
// => { 4: 2 }

collect([1, "1"]).duplicatesStrict().all();
// => {}
```

<FnTry label="collect(items).duplicatesStrict(key)" :fn="(items, key) => collect(items).duplicatesStrict(key || null).all()" :args="[
  { name: 'items', type: 'json', default: [1, '1', 2, '2', 2] },
  { name: 'key', type: 'string', default: '' },
]" />

### each

Run a callback over each item, and return the collection.

Laravel: [`each()`](https://laravel.com/docs/collections#method-each)

The callback receives the item and its key. Return `false` from it to stop iterating.

```js
import { collect } from "@tolki/collection";

const seen = [];

collect([1, 2, 3, 4]).each((item, key) => {
  seen.push(item);

  if (item === 2) {
    return false;
  }
});

seen;
// => [1, 2]

collect({ a: 1, b: 2 })
  .each((item, key) => {})
  .all();
// => { a: 1, b: 2 }
```

<FnTry label="collect(items).each(callback)" :fn="(items, stopAt) => { const seen = []; collect(items).each((item, key) => { seen.push([key, item]); if (item === stopAt) return false; }); return seen; }" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3, 4] },
  { name: 'stopAt', type: 'number', default: 2 },
]" />

### eachSpread

Run a callback over each nested row, passing the row's values as separate arguments, and return the collection.

Laravel: [`eachSpread()`](https://laravel.com/docs/collections#method-eachspread)

The row's key arrives after its values. Return `false` from the callback to stop iterating. A plain object or a `Map` row is spread by its values, and a scalar row is passed whole: see [JavaScript-only additions](./differences.md#javascript-only-additions).

```js
import { collect } from "@tolki/collection";

const seen = [];

collect([
  ["John Doe", 35],
  ["Jane Doe", 33],
]).eachSpread((name, age, key) => {
  seen.push(`${key}: ${name} is ${age}`);
});

seen;
// => ["0: John Doe is 35", "1: Jane Doe is 33"]

const first = [];

collect([
  ["John Doe", 35],
  ["Jane Doe", 33],
]).eachSpread((name, age) => {
  first.push(name);

  return false;
});

first;
// => ["John Doe"]
```

<FnTry label="collect(items).eachSpread(callback)" :fn="(items) => { const seen = []; collect(items).eachSpread((name, age, key) => { seen.push(key + ': ' + name + ' is ' + age); }); return seen; }" :args="[
  { name: 'items', type: 'json', default: [['John Doe', 35], ['Jane Doe', 33]] },
]" />

### empty

The static `empty` method creates a collection with no items.

```js
import { Collection } from "@tolki/collection";

Collection.empty().all();
// => []

Collection.empty().isEmpty();
// => true
```

In TypeScript, name the item type yourself with `Collection.empty<string>()`.

<FnTry label="Collection.empty()" :fn="() => Collection.empty().all()" :args="[]" />

### ensure

Check that every item has the expected type, and throw when one does not.

Laravel: [`ensure()`](https://laravel.com/docs/collections#method-ensure)

The type is a class, a type name such as `"int"`, `"float"`, `"string"`, `"bool"`, `"array"` or `"null"`, or a list of them. When an item matches none, `ensure()` throws an `UnexpectedValueException` that names the item's type and position. It also takes JavaScript's `typeof` names: see [JavaScript-only additions](./differences.md#javascript-only-additions). A class passed as itself accepts its subclasses too, while a class named as a string matches only that class.

`ensure()` checks the items now. It does not stop you adding items of another type later.

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3]).ensure("int").all();
// => [1, 2, 3]

collect([1, "2", 3]).ensure("int");
// => throws UnexpectedValueException

collect([1, "2", true]).ensure(["int", "string", "bool"]).all();
// => [1, "2", true]

collect([new Date(0), new Date(1)])
  .ensure(Date)
  .count();
// => 2

collect([1, 1.5]).ensure("number").all();
// => [1, 1.5]
```

<FnTry label="collect(items).ensure(type)" :fn="(items, type) => collect(items).ensure(type).all()" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3] },
  { name: 'type', type: 'select', default: 'int', options: [
    { label: 'int', value: 'int' },
    { label: 'string', value: 'string' },
    { label: 'bool', value: 'bool' },
    { label: 'array', value: 'array' },
  ] },
]" />

### escapeWhenCastingToString

Make the collection HTML-escape its string form, or stop it doing so.

Casting a collection to a string gives its JSON. Once escaping is on, that string has `&`, `<`, `>`, `"` and `'` replaced with HTML entities. The escaping applies to the string cast alone: `toJson()` is unchanged. Pass `false` to turn escaping off again.

::: warning
Unlike most other collection methods, `escapeWhenCastingToString` does not return a new modified collection; it modifies and returns the collection it is called on.
:::

```js
import { collect } from "@tolki/collection";

const items = collect(["<b>"]);

String(items);
// => '["<b>"]'

items.escapeWhenCastingToString();

String(items);
// => '[&quot;&lt;b&gt;&quot;]'

items.toJson();
// => '["<b>"]'

items.escapeWhenCastingToString(false);

String(items);
// => '["<b>"]'
```

<FnTry label="collect(items).escapeWhenCastingToString(escape)" :fn="(items, escape) => String(collect(items).escapeWhenCastingToString(escape))" :args="[
  { name: 'items', type: 'json', default: ['<b>'] },
  { name: 'escape', type: 'boolean', default: true },
]" />

### every

Determine whether all items pass a truth test.

Laravel: [`every()`](https://laravel.com/docs/collections#method-every)

Besides a callback, `every()` takes a key and a value, or a key, an operator and a value. An empty collection passes.

The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#every).

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3, 4]).every((value, key) => value > 2);
// => false

collect([]).every((value, key) => value > 2);
// => true

collect([{ id: 1 }, { id: 1 }]).every("id", 1);
// => true

collect([{ id: 1 }, { id: 2 }]).every("id", ">=", 1);
// => true
```

<FnTry label="collect(items).every(callback)" :fn="(items, callback) => collect(items).every(callback)" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3, 4] },
  { name: 'callback', type: 'select', default: predicates[0].value, options: predicates },
]" />

### except

Get all items except those with the given keys.

Laravel: [`except()`](https://laravel.com/docs/collections#method-except)

Pass the keys as an array or a collection, or as separate arguments. For the inverse, see `only`. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#except).

```js
import { collect } from "@tolki/collection";

collect({ product_id: 1, price: 100, discount: false })
  .except(["price", "discount"])
  .all();
// => { product_id: 1 }

collect({ a: 1, b: 2, c: 3 }).except("a", "c").all();
// => { b: 2 }

collect([1, 2, 3, 4]).except([0, 2]).all();
// => [2, 4]
```

<FnTry label="collect(items).except(keys)" :fn="(items, keys) => collect(items).except(keys).all()" :args="[
  { name: 'items', type: 'json', default: { product_id: 1, price: 100, discount: false } },
  { name: 'keys', type: 'json', default: ['price', 'discount'] },
]" />

### filter

Keep only the items that pass a truth test.

Laravel: [`filter()`](https://laravel.com/docs/collections#method-filter)

The callback receives the item and its key. Without a callback, `filter()` drops every item that is falsy by [PHP's rules](../arrays-objects/php-semantics.md#truthiness). For the inverse, see `reject`. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#filter).

<!-- docs/php-parity/Collection/filter.json, "filter-list-gap-keys" -->

::: info
A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](./differences.md#keys-and-order).
:::

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3, 4])
  .filter((value, key) => value > 2)
  .all();
// => [3, 4]

collect([1, 2, 3, null, false, "", 0, []]).filter().all();
// => [1, 2, 3]

collect({ id: 1, first: "Hello", second: "World" })
  .filter((value, key) => key !== "id")
  .all();
// => { first: "Hello", second: "World" }
```

<FnTry label="collect(items).filter(callback)" :fn="(items, mode) => (mode === 'none' ? collect(items).filter() : collect(items).filter((value) => value > 2)).all()" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3, 4, null, 0, ''] },
  { name: 'mode', type: 'select', default: 'gt2', options: [
    { label: 'value is greater than 2', value: 'gt2' },
    { label: 'no callback (drop falsy items)', value: 'none' },
  ] },
]" />

### first

Get the first item, or the first item that passes a truth test.

Laravel: [`first()`](https://laravel.com/docs/collections#method-first)

With no match, `first()` returns `null`. Pass a default, or a callback that returns one, as the second argument. To throw instead, use [firstOrFail](#firstorfail). The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#first).

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3, 4]).first((value, key) => value > 2);
// => 3

collect([1, 2, 3, 4]).first();
// => 1

collect([]).first();
// => null

collect([]).first(null, "none");
// => "none"
```

<FnTry label="collect(items).first(callback, fallback)" :fn="(items, callback, fallback) => collect(items).first(callback, fallback)" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3, 4] },
  { name: 'callback', type: 'select', default: predicates[0].value, options: predicates },
  { name: 'fallback', type: 'json', default: 'none' },
]" />

### firstOrFail

Get the first item, or the first item that passes a test, and throw when there is none.

Laravel: [`firstOrFail()`](https://laravel.com/docs/collections#method-first-or-fail)

It works like [first](#first), but throws an `ItemNotFoundException` when no item matches, or when the collection is empty. Besides a callback, it takes a key and a value, or a key, an operator and a value.

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3, 4]).firstOrFail((value, key) => value > 2);
// => 3

collect([{ id: 1 }, { id: 2 }]).firstOrFail("id", "==", 2);
// => { id: 2 }

collect([1, 2, 3, 4]).firstOrFail((value, key) => value > 5);
// => throws ItemNotFoundException

collect([]).firstOrFail();
// => throws ItemNotFoundException
```

<FnTry label="collect(items).firstOrFail(callback)" :fn="(items, callback) => collect(items).firstOrFail(callback)" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3, 4] },
  { name: 'callback', type: 'select', default: predicates[0].value, options: predicates },
]" />

### firstWhere

Get the first item with the given key and value.

Laravel: [`firstWhere()`](https://laravel.com/docs/collections#method-first-where)

It takes the arguments of `where`: a key and a value, or a key, an operator and a value. With a key alone, it returns the first item where that key is truthy. When nothing matches, it returns `null`.

```js
import { collect } from "@tolki/collection";

const users = collect([
  { name: "Regena", age: null },
  { name: "Linda", age: 14 },
  { name: "Diego", age: 23 },
  { name: "Linda", age: 84 },
]);

users.firstWhere("name", "Linda");
// => { name: "Linda", age: 14 }

users.firstWhere("age", ">=", 18);
// => { name: "Diego", age: 23 }

users.firstWhere("age");
// => { name: "Linda", age: 14 }

users.firstWhere("age", ">", 100);
// => null
```

<FnTry label="collect(items).firstWhere(key, operator, value)" :fn="(items, key, operator, value) => collect(items).firstWhere(key, operator, value)" :args="[
  { name: 'items', type: 'json', default: [{ name: 'Regena', age: null }, { name: 'Linda', age: 14 }, { name: 'Diego', age: 23 }] },
  { name: 'key', type: 'string', default: 'age' },
  { name: 'operator', type: 'string', default: '>=' },
  { name: 'value', type: 'number', default: 18 },
]" />

### flatMap

Map each item with a callback, then flatten the result by one level.

Laravel: [`flatMap()`](https://laravel.com/docs/collections#method-flatmap)

The callback receives the item and its key, and returns an array, an object or a collection. The returned items are merged into one collection.

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3])
  .flatMap((value) => [value, value * 10])
  .all();
// => [1, 10, 2, 20, 3, 30]

collect([{ name: "Sally" }, { school: "Arkansas" }, { age: 28 }])
  .flatMap((values) =>
    Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        String(value).toUpperCase(),
      ]),
    ),
  )
  .all();
// => { name: "SALLY", school: "ARKANSAS", age: "28" }
```

<FnTry label="collect(items).flatMap(callback)" :fn="(items, times) => collect(items).flatMap((value) => [value, value * times]).all()" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3] },
  { name: 'times', type: 'number', default: 10 },
]" />

### flatten

Flatten a multi-dimensional collection into a single level.

Laravel: [`flatten()`](https://laravel.com/docs/collections#method-flatten)

Pass a depth to flatten only that many levels. A nested collection is flattened too, and any other object that is not a plain object is kept whole. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#flatten).

```js
import { collect } from "@tolki/collection";

collect({ name: "Taylor", languages: ["PHP", "JavaScript"] })
  .flatten()
  .all();
// => ["Taylor", "PHP", "JavaScript"]

collect([1, [2, [3, 4]], 5])
  .flatten(1)
  .all();
// => [1, 2, [3, 4], 5]

collect({
  Apple: [{ name: "iPhone 6S", brand: "Apple" }],
  Samsung: [{ name: "Galaxy S7", brand: "Samsung" }],
})
  .flatten(1)
  .all();
// => [{ name: "iPhone 6S", brand: "Apple" }, { name: "Galaxy S7", brand: "Samsung" }]
```

<FnTry label="collect(items).flatten(depth)" :fn="(items, depth) => collect(items).flatten(depth ?? Infinity).all()" :args="[
  { name: 'items', type: 'json', default: [1, [2, [3, 4]], 5] },
  { name: 'depth', type: 'number', default: 1 },
]" />

### flip

Swap the collection's keys with their values.

Laravel: [`flip()`](https://laravel.com/docs/collections#method-flip)

The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#flip).

```js
import { collect } from "@tolki/collection";

collect({ name: "Taylor", framework: "Laravel" }).flip().all();
// => { Taylor: "name", Laravel: "framework" }

collect(["a", "b", "c"]).flip().all();
// => { a: 0, b: 1, c: 2 }
```

<FnTry label="collect(items).flip()" :fn="(items) => collect(items).flip().all()" :args="[
  { name: 'items', type: 'json', default: { name: 'Taylor', framework: 'Laravel' } },
]" />

### forget

Remove one or more items by key.

Laravel: [`forget()`](https://laravel.com/docs/collections#method-forget)

Pass one key, an array of keys or a collection of keys. Each key is removed as it is, so a dotted key such as `"a.b"` does not reach a nested value; the [utilities list](../arrays-objects/utilities-list.md#forget) has the version that reads a path.

::: warning
Unlike most other collection methods, `forget` does not return a new modified collection; it modifies and returns the collection it is called on.
:::

```js
import { collect } from "@tolki/collection";

const items = collect({ name: "Taylor", framework: "Laravel" });

items.forget("name").all();
// => { framework: "Laravel" }

items.all();
// => { framework: "Laravel" }

items.forget(["name", "framework"]).all();
// => {}

collect([1, 2, 3, 4]).forget([0, 2]).all();
// => [2, 4]

collect({ a: { b: 1 } })
  .forget("a.b")
  .all();
// => { a: { b: 1 } }
```

<FnTry label="collect(items).forget(keys)" :fn="(items, keys) => collect(items).forget(keys).all()" :args="[
  { name: 'items', type: 'json', default: { name: 'Taylor', framework: 'Laravel' } },
  { name: 'keys', type: 'json', default: ['name'] },
]" />

### forPage

Get the items that belong on a page, given the page number and the number of items per page.

Laravel: [`forPage()`](https://laravel.com/docs/collections#method-forpage)

Pages count from 1.

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3, 4, 5, 6, 7, 8, 9]).forPage(2, 3).all();
// => [4, 5, 6]

collect([1, 2, 3, 4, 5]).forPage(2, 3).all();
// => [4, 5]

collect({ a: 1, b: 2, c: 3 }).forPage(2, 1).all();
// => { b: 2 }
```

<FnTry label="collect(items).forPage(page, perPage)" :fn="(items, page, perPage) => collect(items).forPage(page, perPage).all()" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  { name: 'page', type: 'number', default: 2 },
  { name: 'perPage', type: 'number', default: 3 },
]" />

### fromJson

The static `fromJson` method creates a collection by decoding a JSON string.

Laravel: [`fromJson()`](https://laravel.com/docs/collections#method-fromjson)

An object becomes a keyed collection and an array a list. JSON that cannot be decoded gives an empty collection. The `depth` and `flags` arguments are accepted and ignored: see [Not portable](./differences.md#not-portable).

```js
import { Collection } from "@tolki/collection";

Collection.fromJson('{"name":"Taylor Otwell","role":"Developer"}').all();
// => { name: "Taylor Otwell", role: "Developer" }

Collection.fromJson("[1,2,3]").all();
// => [1, 2, 3]

Collection.fromJson("{bad").all();
// => []
```

<FnTry label="Collection.fromJson(json)" :fn="(json) => Collection.fromJson(json).all()" :args="[
  { name: 'json', type: 'string', default: '[1,2,3]' },
]" />

### get

Get the item at a key, or a default when the key is absent.

Laravel: [`get()`](https://laravel.com/docs/collections#method-get)

The default may be a value or a callback that returns one. The key is looked up as it is, not as a path, so `get("a.b")` does not read a nested value; the [utilities list](../arrays-objects/utilities-list.md#get) has the version that reads a path.

```js
import { collect } from "@tolki/collection";

const user = collect({ name: "Taylor", framework: "Laravel" });

user.get("name");
// => "Taylor"

user.get("age", 34);
// => 34

user.get("email", () => "taylor@example.com");
// => "taylor@example.com"

collect({ a: { b: 1 } }).get("a.b", "default");
// => "default"
```

<FnTry label="collect(items).get(key, fallback)" :fn="(items, key, fallback) => collect(items).get(key, fallback)" :args="[
  { name: 'items', type: 'json', default: { name: 'Taylor', framework: 'Laravel' } },
  { name: 'key', type: 'string', default: 'age' },
  { name: 'fallback', type: 'json', default: 34 },
]" />

### getIterator

Get an iterator over the collection's values.

`for...of` and spreading use this iterator. Call `next()` to step through the values by hand.

```js
import { collect } from "@tolki/collection";

const iterator = collect([10, 20]).getIterator();

iterator.next();
// => { value: 10, done: false }

iterator.next();
// => { value: 20, done: false }

iterator.next().done;
// => true

[...collect({ a: 1, b: 2 }).getIterator()];
// => [1, 2]
```

<FnTry label="collect(items).getIterator()" :fn="(items) => [...collect(items).getIterator()]" :args="[
  { name: 'items', type: 'json', default: { a: 1, b: 2 } },
]" />

### getOrPut

Get the item at a key. When the key is absent, put a value under it and return that value.

The value may be a callback, which runs only when the key is absent.

::: warning
Unlike most other collection methods, `getOrPut` does not return a new modified collection; it modifies the collection it is called on.
:::

```js
import { collect } from "@tolki/collection";

const items = collect({ a: 1, b: 2 });

items.getOrPut("b", 3);
// => 2

items.getOrPut("c", 3);
// => 3

items.all();
// => { a: 1, b: 2, c: 3 }

let calls = 0;

items.getOrPut("d", () => {
  calls += 1;

  return 4;
});
// => 4

items.getOrPut("d", () => {
  calls += 1;

  return 5;
});
// => 4

calls;
// => 1
```

<FnTry label="collect(items).getOrPut(key, value)" :fn="(items, key, value) => { const collection = collect(items); const returned = collection.getOrPut(key, value); return { returned, collection: collection.all() }; }" :args="[
  { name: 'items', type: 'json', default: { a: 1, b: 2 } },
  { name: 'key', type: 'string', default: 'c' },
  { name: 'value', type: 'json', default: 3 },
]" />

### groupBy

Group the items by a key or a callback.

Laravel: [`groupBy()`](https://laravel.com/docs/collections#method-groupby)

Each group is a collection, so use `toArray()` to read them all at once. Pass a callback to compute the group key. Pass an array of keys and callbacks to group in levels, one per entry.

<!-- docs/php-parity/Collection/groupBy.json, "C32-E-groupBy-preserve-keys-list-backing" -->

Pass `true` as the second argument to keep each item's key inside its group. A list's items then keep their positions, as [chunk](#chunk) does. See [Keys and order](./differences.md#keys-and-order).

```js
import { collect } from "@tolki/collection";

const orders = collect([
  { account_id: "account-x10", product: "Chair" },
  { account_id: "account-x10", product: "Bookcase" },
  { account_id: "account-x11", product: "Desk" },
]);

orders.groupBy("account_id").toArray();
// => {
//   "account-x10": [
//     { account_id: "account-x10", product: "Chair" },
//     { account_id: "account-x10", product: "Bookcase" },
//   ],
//   "account-x11": [{ account_id: "account-x11", product: "Desk" }],
// }

orders.groupBy((item, key) => item.account_id.slice(-3)).toArray();
// => {
//   x10: [
//     { account_id: "account-x10", product: "Chair" },
//     { account_id: "account-x10", product: "Bookcase" },
//   ],
//   x11: [{ account_id: "account-x11", product: "Desk" }],
// }

collect(["a", "b", "c", "d"])
  .groupBy((value, key) => (key % 2 === 0 ? "even" : "odd"), true)
  .toArray();
// => { even: { 0: "a", 2: "c" }, odd: { 1: "b", 3: "d" } }

collect({
  10: { user: 1, skill: 1, roles: ["Role_1", "Role_3"] },
  20: { user: 2, skill: 2, roles: ["Role_2"] },
})
  .groupBy(["skill", (item) => item.roles], true)
  .toArray();
// => {
//   1: {
//     Role_1: { 10: { user: 1, skill: 1, roles: ["Role_1", "Role_3"] } },
//     Role_3: { 10: { user: 1, skill: 1, roles: ["Role_1", "Role_3"] } },
//   },
//   2: { Role_2: { 20: { user: 2, skill: 2, roles: ["Role_2"] } } },
// }
```

<FnTry label="collect(items).groupBy(key, preserveKeys)" :fn="(items, key, preserveKeys) => collect(items).groupBy(key, preserveKeys).toArray()" :args="[
  { name: 'items', type: 'json', default: [{ account_id: 'account-x10', product: 'Chair' }, { account_id: 'account-x10', product: 'Bookcase' }, { account_id: 'account-x11', product: 'Desk' }] },
  { name: 'key', type: 'string', default: 'account_id' },
  { name: 'preserveKeys', type: 'boolean', default: false },
]" />

### has

Determine whether a key exists in the collection.

Laravel: [`has()`](https://laravel.com/docs/collections#method-has)

Pass an array of keys, or several arguments, to require them all. Keys are looked up as they are, not as paths, so `has("a.b")` does not look inside `a`; the [utilities list](../arrays-objects/utilities-list.md#has) has the version that reads a path. A key that holds `null` still exists.

```js
import { collect } from "@tolki/collection";

const order = collect({ account_id: 1, product: "Desk", amount: 5 });

order.has("product");
// => true

order.has(["product", "amount"]);
// => true

order.has(["amount", "price"]);
// => false

collect({ a: { b: 1 } }).has("a.b");
// => false
```

<FnTry label="collect(items).has(keys)" :fn="(items, keys) => collect(items).has(keys)" :args="[
  { name: 'items', type: 'json', default: { account_id: 1, product: 'Desk', amount: 5 } },
  { name: 'keys', type: 'json', default: ['product', 'amount'] },
]" />

### hasAny

Determine whether any of the given keys exists in the collection.

Laravel: [`hasAny()`](https://laravel.com/docs/collections#method-hasany)

It looks keys up as they are, like [has](#has). The [utilities list](../arrays-objects/utilities-list.md#hasany) has the version that reads paths.

```js
import { collect } from "@tolki/collection";

const order = collect({ account_id: 1, product: "Desk", amount: 5 });

order.hasAny(["product", "price"]);
// => true

order.hasAny(["name", "price"]);
// => false
```

<FnTry label="collect(items).hasAny(keys)" :fn="(items, keys) => collect(items).hasAny(keys)" :args="[
  { name: 'items', type: 'json', default: { account_id: 1, product: 'Desk', amount: 5 } },
  { name: 'keys', type: 'json', default: ['product', 'price'] },
]" />

### hasMany

Determine whether the collection holds more than one item, optionally counting only the items that match.

Laravel: [`hasMany()`](https://laravel.com/docs/collections#method-hasmany)

Pass a callback, or a key and a value, or a key, an operator and a value, to count only the matching items.

```js
import { collect } from "@tolki/collection";

collect([]).hasMany();
// => false

collect(["1"]).hasMany();
// => false

collect([1, 2, 3]).hasMany();
// => true

collect([{ age: 2 }, { age: 3 }]).hasMany((item) => item.age === 2);
// => false

collect([{ age: 2 }, { age: 3 }]).hasMany("age", ">", 1);
// => true
```

<FnTry label="collect(items).hasMany(callback)" :fn="(items, callback) => collect(items).hasMany(callback)" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3] },
  { name: 'callback', type: 'select', default: predicates[0].value, options: predicates },
]" />

### hasSole

Determine whether the collection holds exactly one item, optionally counting only the items that match.

Laravel: [`hasSole()`](https://laravel.com/docs/collections#method-hassole)

It takes the same arguments as [hasMany](#hasmany).

```js
import { collect } from "@tolki/collection";

collect([]).hasSole();
// => false

collect(["1"]).hasSole();
// => true

collect([1, 2, 3]).hasSole((item) => item === 2);
// => true

collect([{ age: 2 }, { age: 3 }]).hasSole("age", 2);
// => true
```

<FnTry label="collect(items).hasSole(callback)" :fn="(items, callback) => collect(items).hasSole(callback)" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3] },
  { name: 'callback', type: 'select', default: predicates[2].value, options: predicates },
]" />

### implode

Join the items into a string.

Laravel: [`implode()`](https://laravel.com/docs/collections#method-implode)

For arrays or objects, pass the key to join and the glue. For strings and numbers, pass the glue alone. A callback formats each item before it is joined.

```js
import { collect } from "@tolki/collection";

const products = collect([
  { account_id: 1, product: "Desk" },
  { account_id: 2, product: "Chair" },
]);

products.implode("product", ", ");
// => "Desk, Chair"

products.implode((item, key) => item.product.toUpperCase(), ", ");
// => "DESK, CHAIR"

collect([1, 2, 3, 4, 5]).implode("-");
// => "1-2-3-4-5"
```

<FnTry label="collect(items).implode(glue)" :fn="(items, glue) => collect(items).implode(glue)" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3, 4, 5] },
  { name: 'glue', type: 'string', default: '-' },
]" />

### intersect

Remove the values that are not in the given array or collection.

Laravel: [`intersect()`](https://laravel.com/docs/collections#method-intersect)

Only the values are compared, as strings, so `2` matches `"2"`. Array and object items are matched by identity: see [Differences from Laravel](./differences.md#values). The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#intersect).

<!-- docs/php-parity/Collection/intersect.json, "X12 intersect compares values only" -->

::: info
A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](./differences.md#keys-and-order).
:::

```js
import { collect } from "@tolki/collection";

collect(["Desk", "Sofa", "Chair"])
  .intersect(["Desk", "Chair", "Bookcase"])
  .all();
// => ["Desk", "Chair"]

collect({ a: 1, b: 2 }).intersect({ x: 2 }).all();
// => { b: 2 }

collect([1, 2, 3]).intersect(["2"]).all();
// => [2]
```

<FnTry label="collect(items).intersect(other)" :fn="(items, other) => collect(items).intersect(other).all()" :args="[
  { name: 'items', type: 'json', default: ['Desk', 'Sofa', 'Chair'] },
  { name: 'other', type: 'json', default: ['Desk', 'Chair', 'Bookcase'] },
]" />
