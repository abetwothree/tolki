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

const mappers = [
  { label: "doubled", value: (v) => v * 2 },
  { label: "squared", value: (v) => v * v },
  { label: "plus its key", value: (v, k) => v + k },
];

const spreadCallbacks = [
  { label: "sum of the row", value: (a, b) => a + b },
  { label: "product of the row", value: (a, b) => a * b },
];

const groupCallbacks = [
  { label: "even or odd", value: (v) => ({ [v % 2 === 0 ? "even" : "odd"]: v }) },
  { label: "the value itself", value: (v) => ({ [v]: v }) },
];

const pairCallbacks = [
  { label: "n-value keyed, doubled", value: (v) => ({ ["n" + v]: v * 2 }) },
  { label: "key kept, value squared", value: (v, k) => ({ [k]: v * v }) },
];

const pipeCallbacks = [
  { label: "the sum", value: (collection) => collection.sum() },
  { label: "the count", value: (collection) => collection.count() },
  { label: "the first item", value: (collection) => collection.first() },
];

const pipeThroughCallbacks = [
  {
    label: "merge 4 and 5, then sum",
    value: [(c) => c.merge([4, 5]), (c) => c.sum()],
  },
  {
    label: "double each item, then sum",
    value: [(c) => c.map((v) => v * 2), (c) => c.sum()],
  },
  { label: "none", value: [] },
];

const reduceCallbacks = [
  { label: "add the value", value: (carry, v) => carry + v },
  { label: "multiply by the value", value: (carry, v) => carry * v },
  { label: "count the items", value: (carry) => carry + 1 },
];

const reduceIntoCallbacks = [
  { label: "add each value (start from 0)", value: (total, v) => total + v },
  {
    label: "collect the even values (start from [])",
    value: (result, v) => {
      if (v % 2 === 0) {
        result.push(v);
      }
    },
  },
];

const spreadReducers = [
  { label: "sum and count (start from [0, 0])", value: (sum, count, v) => [sum + v, count + 1] },
  {
    label: "sum and sum of squares (start from [0, 0])",
    value: (sum, squares, v) => [sum + v, squares + v * v],
  },
];
</script>

These are the methods of the `Collection` class. Every example builds a collection with [`collect()`](./index.md#creating-collections) and reads the items back with `all()` or `toArray()`. Each section ends with a box you can edit to try the method.

## Methods List

<div class="collection-method-list" markdown="1">

[add](#add) [after](#after) [all](#all) [average](#average) [avg](#avg) [before](#before) [chunk](#chunk) [chunkBy](#chunkby) [chunkWhile](#chunkwhile) [collapse](#collapse) [collapseWithKeys](#collapsewithkeys) [collect](#collect) [combine](#combine) [concat](#concat) [contains](#contains) [containsManyItems](#containsmanyitems) [containsOneItem](#containsoneitem) [containsStrict](#containsstrict) [count](#count) [countBy](#countby) [crossJoin](#crossjoin) [diff](#diff) [diffAssoc](#diffassoc) [diffAssocUsing](#diffassocusing) [diffKeys](#diffkeys) [diffKeysUsing](#diffkeysusing) [diffUsing](#diffusing) [doesntContain](#doesntcontain) [doesntContainStrict](#doesntcontainstrict) [dot](#dot) [dump](#dump) [duplicates](#duplicates) [duplicatesStrict](#duplicatesstrict) [each](#each) [eachSpread](#eachspread) [empty](#empty) [ensure](#ensure) [escapeWhenCastingToString](#escapewhencastingtostring) [every](#every) [except](#except) [filter](#filter) [first](#first) [firstOrFail](#firstorfail) [firstWhere](#firstwhere) [flatMap](#flatmap) [flatten](#flatten) [flip](#flip) [forget](#forget) [forPage](#forpage) [fromJson](#fromjson) [get](#get) [getIterator](#getiterator) [getOrPut](#getorput) [groupBy](#groupby) [has](#has) [hasAny](#hasany) [hasMany](#hasmany) [hasSole](#hassole) [implode](#implode) [intersect](#intersect) [intersectAssoc](#intersectassoc) [intersectAssocUsing](#intersectassocusing) [intersectByKeys](#intersectbykeys) [intersectUsing](#intersectusing) [isEmpty](#isempty) [isNotEmpty](#isnotempty) [join](#join) [jsonSerialize](#jsonserialize) [keyBy](#keyby) [keys](#keys) [last](#last) [length](#length) [make](#make) [map](#map) [mapInto](#mapinto) [mapSpread](#mapspread) [mapToDictionary](#maptodictionary) [mapToGroups](#maptogroups) [mapWithKeys](#mapwithkeys) [max](#max) [median](#median) [merge](#merge) [mergeRecursive](#mergerecursive) [min](#min) [mode](#mode) [multiply](#multiply) [nth](#nth) [offsetExists](#offsetexists) [offsetGet](#offsetget) [offsetSet](#offsetset) [offsetUnset](#offsetunset) [only](#only) [pad](#pad) [partition](#partition) [percentage](#percentage) [pipe](#pipe) [pipeInto](#pipeinto) [pipeThrough](#pipethrough) [pluck](#pluck) [pop](#pop) [prepend](#prepend) [pull](#pull) [push](#push) [put](#put) [random](#random) [range](#range) [reduce](#reduce) [reduceInto](#reduceinto) [reduceSpread](#reducespread) [reduceWithKeys](#reducewithkeys) [reject](#reject) [replace](#replace) [replaceRecursive](#replacerecursive) [reverse](#reverse) [search](#search) [select](#select) [shift](#shift) [shuffle](#shuffle) [skip](#skip) [skipUntil](#skipuntil)

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

The appended values get new integer keys, even when they came from a keyed source. To keep keys, use [`merge()`](#merge).

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

The [`length`](#length) property gives the same number. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#count).

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

Pass the keys as an array or a collection, or as separate arguments. For the inverse, see [only](#only). The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#except).

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

The callback receives the item and its key. Without a callback, `filter()` drops every item that is falsy by [PHP's rules](../arrays-objects/php-semantics.md#truthiness). For the inverse, see [reject](#reject). The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#filter).

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

<!-- docs/php-parity/Collection/forget.json, "forget-list-gap-keys" -->

::: info
A list stays a list, so the items after the removed ones move down. In Laravel they keep the keys they had. See [Keys and order](./differences.md#keys-and-order).
:::

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

### intersectAssoc

Keep the key and value pairs that are present in the collection and in the given array or collection.

Laravel: [`intersectAssoc()`](https://laravel.com/docs/collections#method-intersectAssoc)

A pair stays only when both its key and its value match. Values are compared as strings, so `1` matches `"1"`. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#intersectassoc).

<!-- docs/php-parity/Collection/intersectAssoc.json, "intersectAssoc-list-keeps-gap-keys" -->

::: info
A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](./differences.md#keys-and-order).
:::

```js
import { collect } from "@tolki/collection";

collect({ color: "red", size: "M", material: "cotton" })
  .intersectAssoc({ color: "blue", size: "M", material: "polyester" })
  .all();
// => { size: "M" }

collect([1, 2, 3]).intersectAssoc([1, 2, 9]).all();
// => [1, 2]

collect({ a: 1 }).intersectAssoc({ a: "1" }).all();
// => { a: 1 }
```

<FnTry label="collect(items).intersectAssoc(other)" :fn="(items, other) => collect(items).intersectAssoc(other).all()" :args="[
  { name: 'items', type: 'json', default: { color: 'red', size: 'M', material: 'cotton' } },
  { name: 'other', type: 'json', default: { color: 'blue', size: 'M', material: 'polyester' } },
]" />

### intersectAssocUsing

Keep the key and value pairs that are present in the collection and in the given items, comparing keys with a callback of your own.

Laravel: [`intersectAssocUsing()`](https://laravel.com/docs/collections#method-intersectassocusing)

The callback receives two keys and answers `0`, or `true`, when they match. Values are compared as strings, so `1` matches `"1"`. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#intersectassocusing).

<!-- docs/php-parity/Collection/intersectAssocUsing.json, "intersectAssocUsing-list-keeps-gap-keys" -->

::: info
A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](./differences.md#keys-and-order).
:::

```js
import { collect } from "@tolki/collection";

const ignoreCase = (a, b) =>
  String(a).toLowerCase() === String(b).toLowerCase() ? 0 : 1;

collect({ color: "red", Size: "M", material: "cotton" })
  .intersectAssocUsing(
    { color: "blue", size: "M", material: "polyester" },
    ignoreCase,
  )
  .all();
// => { Size: "M" }

collect({ a: 1 }).intersectAssocUsing({ a: "1" }, ignoreCase).all();
// => { a: 1 }
```

<FnTry label="collect(items).intersectAssocUsing(other, callback)" :fn="(items, other, callback) => collect(items).intersectAssocUsing(other, callback).all()" :args="[
  { name: 'items', type: 'json', default: { color: 'red', Size: 'M', material: 'cotton' } },
  { name: 'other', type: 'json', default: { color: 'blue', size: 'M', material: 'polyester' } },
  { name: 'callback', type: 'select', default: comparators[0].value, options: comparators },
]" />

### intersectByKeys

Keep the items whose keys are present in the given array or collection.

Laravel: [`intersectByKeys()`](https://laravel.com/docs/collections#method-intersectbykeys)

Values are ignored. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#intersectbykeys).

<!-- docs/php-parity/Collection/intersectByKeys.json, "intersectByKeys-list-keeps-gap-keys" -->

::: info
A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](./differences.md#keys-and-order).
:::

```js
import { collect } from "@tolki/collection";

collect({ serial: "UX301", type: "screen", year: 2009 })
  .intersectByKeys({ reference: "UX404", type: "tab", year: 2011 })
  .all();
// => { type: "screen", year: 2009 }
```

<FnTry label="collect(items).intersectByKeys(other)" :fn="(items, other) => collect(items).intersectByKeys(other).all()" :args="[
  { name: 'items', type: 'json', default: { serial: 'UX301', type: 'screen', year: 2009 } },
  { name: 'other', type: 'json', default: { reference: 'UX404', type: 'tab', year: 2011 } },
]" />

### intersectUsing

Remove the values that are not in the given array or collection, comparing the values with a callback of your own.

Laravel: [`intersectUsing()`](https://laravel.com/docs/collections#method-intersectusing)

The callback receives two values and answers `0`, or `true`, when they match. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#intersectusing).

<!-- docs/php-parity/Collection/intersectUsing.json, "C32-F-intersectUsing-spaceship-comparator" -->

::: info
A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](./differences.md#keys-and-order).
:::

```js
import { collect } from "@tolki/collection";

const ignoreCase = (a, b) => a.toLowerCase().localeCompare(b.toLowerCase());

collect(["Desk", "Sofa", "Chair"])
  .intersectUsing(["desk", "chair", "bookcase"], ignoreCase)
  .all();
// => ["Desk", "Chair"]
```

<FnTry label="collect(items).intersectUsing(other, callback)" :fn="(items, other, callback) => collect(items).intersectUsing(other, callback).all()" :args="[
  { name: 'items', type: 'json', default: ['Desk', 'Sofa', 'Chair'] },
  { name: 'other', type: 'json', default: ['desk', 'chair', 'bookcase'] },
  { name: 'callback', type: 'select', default: comparators[0].value, options: comparators },
]" />

### isEmpty

Determine whether the collection has no items.

Laravel: [`isEmpty()`](https://laravel.com/docs/collections#method-isempty)

```js
import { collect } from "@tolki/collection";

collect([]).isEmpty();
// => true

collect([1, 2, 3]).isEmpty();
// => false
```

<FnTry label="collect(items).isEmpty()" :fn="(items) => collect(items).isEmpty()" :args="[
  { name: 'items', type: 'json', default: [] },
]" />

### isNotEmpty

Determine whether the collection has at least one item.

Laravel: [`isNotEmpty()`](https://laravel.com/docs/collections#method-isnotempty)

```js
import { collect } from "@tolki/collection";

collect([]).isNotEmpty();
// => false

collect([1, 2, 3]).isNotEmpty();
// => true
```

<FnTry label="collect(items).isNotEmpty()" :fn="(items) => collect(items).isNotEmpty()" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3] },
]" />

### join

Join the items into a string, with a separate glue for the last item if you want one.

Laravel: [`join()`](https://laravel.com/docs/collections#method-join)

The second argument is placed before the last item. With one item, that item is returned as it is. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#join).

```js
import { collect } from "@tolki/collection";

collect(["a", "b", "c"]).join(", ");
// => "a, b, c"

collect(["a", "b", "c"]).join(", ", ", and ");
// => "a, b, and c"

collect(["a", "b"]).join(", ", " and ");
// => "a and b"

collect(["a"]).join(", ", " and ");
// => "a"

collect([]).join(", ", " and ");
// => ""
```

<FnTry label="collect(items).join(glue, finalGlue)" :fn="(items, glue, finalGlue) => collect(items).join(glue, finalGlue)" :args="[
  { name: 'items', type: 'json', default: ['a', 'b', 'c'] },
  { name: 'glue', type: 'string', default: ', ' },
  { name: 'finalGlue', type: 'string', default: ', and ' },
]" />

### jsonSerialize

Get the items in a form that `JSON.stringify` can encode.

A list, or a collection whose keys run `0..n-1` in order, gives an array. Any other keyed collection gives a record. Nested collections are converted too. See [Keys and order](./differences.md#keys-and-order) for how a keyed collection holds integer keys.

```js
import { collect } from "@tolki/collection";

collect([1, 2]).jsonSerialize();
// => [1, 2]

collect({ a: 1, b: 2 }).jsonSerialize();
// => { a: 1, b: 2 }

collect({ 0: "a", 1: "b" }).jsonSerialize();
// => ["a", "b"]

collect([collect([1]), { a: 1 }]).jsonSerialize();
// => [[1], { a: 1 }]
```

<FnTry label="collect(items).jsonSerialize()" :fn="(items) => collect(items).jsonSerialize()" :args="[
  { name: 'items', type: 'json', default: { 0: 'a', 1: 'b' } },
]" />

### keyBy

Key the collection by a field of each item, or by what a callback returns.

Laravel: [`keyBy()`](https://laravel.com/docs/collections#method-keyby)

When several items give the same key, only the last one is kept. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#keyby).

```js
import { collect } from "@tolki/collection";

const products = collect([
  { product_id: "prod-100", name: "Desk" },
  { product_id: "prod-200", name: "Chair" },
]);

products.keyBy("product_id").all();
// => {
//   "prod-100": { product_id: "prod-100", name: "Desk" },
//   "prod-200": { product_id: "prod-200", name: "Chair" },
// }

products.keyBy((item) => item.product_id.toUpperCase()).all();
// => {
//   "PROD-100": { product_id: "prod-100", name: "Desk" },
//   "PROD-200": { product_id: "prod-200", name: "Chair" },
// }
```

<FnTry label="collect(items).keyBy(key)" :fn="(items, key) => collect(items).keyBy(key).all()" :args="[
  { name: 'items', type: 'json', default: [{ product_id: 'prod-100', name: 'Desk' }, { product_id: 'prod-200', name: 'Chair' }] },
  { name: 'key', type: 'string', default: 'product_id' },
]" />

### keys

Get the keys of the collection as a new collection.

Laravel: [`keys()`](https://laravel.com/docs/collections#method-keys)

The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#keys).

```js
import { collect } from "@tolki/collection";

collect({
  "prod-100": { product_id: "prod-100", name: "Desk" },
  "prod-200": { product_id: "prod-200", name: "Chair" },
})
  .keys()
  .all();
// => ["prod-100", "prod-200"]

collect(["a", "b", "c"]).keys().all();
// => [0, 1, 2]
```

<FnTry label="collect(items).keys()" :fn="(items) => collect(items).keys().all()" :args="[
  { name: 'items', type: 'json', default: { 'prod-100': 1, 'prod-200': 2 } },
]" />

### last

Get the last item, or the last item that passes a test.

Laravel: [`last()`](https://laravel.com/docs/collections#method-last)

With no match, `last` returns `null`, or the default you pass as the second argument, which may be a callback. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#last).

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3, 4]).last((value) => value < 3);
// => 2

collect([1, 2, 3, 4]).last();
// => 4

collect([]).last();
// => null

collect([1, 2]).last((value) => value > 5, "none");
// => "none"
```

<FnTry label="collect(items).last(callback)" :fn="(items, callback) => collect(items).last(callback)" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3, 4] },
  { name: 'callback', type: 'select', default: predicates[2].value, options: predicates },
]" />

### length

<Badge type="info" text="JS only" />

Get the number of items in the collection, as a property.

It gives the same number as [`count()`](#count), and lets a collection work with APIs that read `length`, such as `Array.from()`.

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3]).length;
// => 3

collect({ a: 1, b: 2 }).length;
// => 2
```

<FnTry label="collect(items).length" :fn="(items) => collect(items).length" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3] },
]" />

### make

Create a new collection from the given items.

Laravel: [`make()`](https://laravel.com/docs/collections#method-make)

The static `make` method does the same as [`collect()`](./index.md#creating-collections). Called on a subclass, it builds an instance of that subclass.

```js
import { Collection } from "@tolki/collection";

Collection.make([1, 2, 3]).all();
// => [1, 2, 3]

Collection.make({ a: 1, b: 2 }).all();
// => { a: 1, b: 2 }

Collection.make(null).all();
// => []
```

<FnTry label="Collection.make(items)" :fn="(items) => Collection.make(items).all()" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3] },
]" />

### map

Run a callback over every item and collect the results in a new collection.

Laravel: [`map()`](https://laravel.com/docs/collections#method-map)

The callback receives the value and the key, and the keys are kept. Like most collection methods, `map` returns a new collection and leaves the original as it was. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#map).

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3, 4, 5])
  .map((value) => value * 2)
  .all();
// => [2, 4, 6, 8, 10]

collect({ a: 1, b: 2 })
  .map((value, key) => `${key}${value}`)
  .all();
// => { a: "a1", b: "b2" }
```

<FnTry label="collect(items).map(callback)" :fn="(items, callback) => collect(items).map(callback).all()" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3, 4, 5] },
  { name: 'callback', type: 'select', default: mappers[0].value, options: mappers },
]" />

### mapInto

Turn every item into a new instance of a class.

Laravel: [`mapInto()`](https://laravel.com/docs/collections#method-mapinto)

The class constructor receives each value, and then its key. The example maps each instance to its `code`, so the result is readable.

```js
import { collect } from "@tolki/collection";

class Currency {
  constructor(code) {
    this.code = code;
  }
}

collect(["USD", "EUR", "GBP"])
  .mapInto(Currency)
  .map((currency) => currency.code)
  .all();
// => ["USD", "EUR", "GBP"]
```

### mapSpread

Run a callback over every nested row, passing the items of the row as separate arguments.

Laravel: [`mapSpread()`](https://laravel.com/docs/collections#method-mapspread)

The key of the row comes after its items. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#mapspread).

```js
import { collect } from "@tolki/collection";

collect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  .chunk(2)
  .mapSpread((even, odd) => even + odd)
  .all();
// => [1, 5, 9, 13, 17]

collect([
  [1, "a"],
  [2, "b"],
])
  .mapSpread((number, letter, key) => `${number}${letter}${key}`)
  .all();
// => ["1a0", "2b1"]
```

<FnTry label="collect(items).mapSpread(callback)" :fn="(items, callback) => collect(items).mapSpread(callback).all()" :args="[
  { name: 'items', type: 'json', default: [[1, 2], [3, 4]] },
  { name: 'callback', type: 'select', default: spreadCallbacks[0].value, options: spreadCallbacks },
]" />

### mapToDictionary

Run a callback that gives one key and value pair for each item, and gather the values under their keys as arrays.

The callback returns an object with a single pair. Only its first pair is read, so a list it returns files its first value under key `0`.

```js
import { collect } from "@tolki/collection";

collect([
  { id: 1, name: "A" },
  { id: 2, name: "B" },
  { id: 3, name: "A" },
])
  .mapToDictionary((item) => ({ [item.name]: item.id }))
  .all();
// => { A: [1, 3], B: [2] }

collect([{ id: 1, name: "A" }])
  .mapToDictionary((item) => [item.name, item.id])
  .all();
// => { 0: ["A"] }
```

<FnTry label="collect(items).mapToDictionary(callback)" :fn="(items, callback) => collect(items).mapToDictionary(callback).all()" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3, 4] },
  { name: 'callback', type: 'select', default: groupCallbacks[0].value, options: groupCallbacks },
]" />

### mapToGroups

Run a callback that gives one key and value pair for each item, and gather the values into collections under their keys.

Laravel: [`mapToGroups()`](https://laravel.com/docs/collections#method-maptogroups)

The callback returns an object with a single pair. Each group is a collection, so use `.toArray()` to read them all at once.

```js
import { collect } from "@tolki/collection";

const grouped = collect([
  { name: "John Doe", department: "Sales" },
  { name: "Jane Doe", department: "Sales" },
  { name: "Johnny Doe", department: "Marketing" },
]).mapToGroups((item) => ({ [item.department]: item.name }));

grouped.toArray();
// => {
//   Sales: ["John Doe", "Jane Doe"],
//   Marketing: ["Johnny Doe"],
// }

grouped.get("Sales").all();
// => ["John Doe", "Jane Doe"]
```

<FnTry label="collect(items).mapToGroups(callback)" :fn="(items, callback) => collect(items).mapToGroups(callback).toArray()" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3, 4] },
  { name: 'callback', type: 'select', default: groupCallbacks[0].value, options: groupCallbacks },
]" />

### mapWithKeys

Run a callback that gives one key and value pair for each item, and build a collection from the pairs.

Laravel: [`mapWithKeys()`](https://laravel.com/docs/collections#method-mapwithkeys)

The callback returns an object with a single pair. When two items give the same key, the later one wins. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#mapwithkeys).

```js
import { collect } from "@tolki/collection";

collect([
  { name: "John", department: "Sales", email: "john@example.com" },
  { name: "Jane", department: "Marketing", email: "jane@example.com" },
])
  .mapWithKeys((item) => ({ [item.email]: item.name }))
  .all();
// => { "john@example.com": "John", "jane@example.com": "Jane" }
```

<FnTry label="collect(items).mapWithKeys(callback)" :fn="(items, callback) => collect(items).mapWithKeys(callback).all()" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3] },
  { name: 'callback', type: 'select', default: pairCallbacks[0].value, options: pairCallbacks },
]" />

### max

Get the largest value, or the largest value at a key.

Laravel: [`max()`](https://laravel.com/docs/collections#method-max)

Pass a key or path, or a callback that gives the value to compare. `null` items are skipped, and an empty collection gives `null`.

```js
import { collect } from "@tolki/collection";

collect([{ foo: 10 }, { foo: 20 }]).max("foo");
// => 20

collect([1, 2, 3, 4, 5]).max();
// => 5

collect([1, null, 3]).max();
// => 3

collect([]).max();
// => null
```

<FnTry label="collect(items).max(key)" :fn="(items, key) => collect(items).max(key || null)" :args="[
  { name: 'items', type: 'json', default: [{ foo: 10 }, { foo: 20 }] },
  { name: 'key', type: 'string', default: 'foo' },
]" />

### median

Get the median of the values, or of the values at a key.

Laravel: [`median()`](https://laravel.com/docs/collections#method-median)

An odd count gives the middle value, and an even count the average of the two in the middle. `null` items are skipped, and a collection with nothing left gives `null`.

```js
import { collect } from "@tolki/collection";

collect([{ foo: 10 }, { foo: 10 }, { foo: 20 }, { foo: 40 }]).median("foo");
// => 15

collect([1, 1, 2, 4]).median();
// => 1.5

collect([3, 1, 2]).median();
// => 2

collect([]).median();
// => null
```

<FnTry label="collect(items).median(key)" :fn="(items, key) => collect(items).median(key || null)" :args="[
  { name: 'items', type: 'json', default: [1, 1, 2, 4] },
  { name: 'key', type: 'string', default: '' },
]" />

### merge

Merge the given array or collection into the collection.

Laravel: [`merge()`](https://laravel.com/docs/collections#method-merge)

A string key in the given items overwrites the same key in the collection. Integer keys are not matched: the given values are appended after the collection's own, and the result is renumbered.

```js
import { collect } from "@tolki/collection";

collect({ product_id: 1, price: 100 })
  .merge({ price: 200, discount: false })
  .all();
// => { product_id: 1, price: 200, discount: false }

collect(["Desk", "Chair"]).merge(["Bookcase", "Door"]).all();
// => ["Desk", "Chair", "Bookcase", "Door"]
```

<FnTry label="collect(items).merge(other)" :fn="(items, other) => collect(items).merge(other).all()" :args="[
  { name: 'items', type: 'json', default: { product_id: 1, price: 100 } },
  { name: 'other', type: 'json', default: { price: 200, discount: false } },
]" />

### mergeRecursive

Merge the given array or collection into the collection, going down into the values they share.

Laravel: [`mergeRecursive()`](https://laravel.com/docs/collections#method-mergerecursive)

When both sides hold a string key, their values are merged into an array, and arrays are merged again at every depth. Integer keys are appended.

```js
import { collect } from "@tolki/collection";

collect({ product_id: 1, price: 100 })
  .mergeRecursive({ product_id: 2, price: 200, discount: false })
  .all();
// => { product_id: [1, 2], price: [100, 200], discount: false }

collect({ a: { b: 1 } })
  .mergeRecursive({ a: { c: 2 } })
  .all();
// => { a: { b: 1, c: 2 } }

collect({ a: { b: 1 } })
  .mergeRecursive({ a: { b: 2 } })
  .all();
// => { a: { b: [1, 2] } }
```

<FnTry label="collect(items).mergeRecursive(other)" :fn="(items, other) => collect(items).mergeRecursive(other).all()" :args="[
  { name: 'items', type: 'json', default: { product_id: 1, price: 100 } },
  { name: 'other', type: 'json', default: { product_id: 2, price: 200, discount: false } },
]" />

### min

Get the smallest value, or the smallest value at a key.

Laravel: [`min()`](https://laravel.com/docs/collections#method-min)

Pass a key or path, or a callback that gives the value to compare. `null` items are skipped, and an empty collection gives `null`.

```js
import { collect } from "@tolki/collection";

collect([{ foo: 10 }, { foo: 20 }]).min("foo");
// => 10

collect([1, 2, 3, 4, 5]).min();
// => 1

collect([null]).min();
// => null
```

<FnTry label="collect(items).min(key)" :fn="(items, key) => collect(items).min(key || null)" :args="[
  { name: 'items', type: 'json', default: [{ foo: 10 }, { foo: 20 }] },
  { name: 'key', type: 'string', default: 'foo' },
]" />

### mode

Get the value that appears most often, or the values at a key.

Laravel: [`mode()`](https://laravel.com/docs/collections#method-mode)

The answer is always an array, because several values can tie. Tied values come in the order they first appear. `null` items are skipped, and a collection with nothing left gives `null`.

```js
import { collect } from "@tolki/collection";

collect([{ foo: 10 }, { foo: 10 }, { foo: 20 }, { foo: 40 }]).mode("foo");
// => [10]

collect([1, 1, 2, 4]).mode();
// => [1]

collect([1, 1, 2, 2]).mode();
// => [1, 2]

collect([2, 2, 1, 1]).mode();
// => [2, 1]

collect([]).mode();
// => null
```

<FnTry label="collect(items).mode(key)" :fn="(items, key) => collect(items).mode(key || null)" :args="[
  { name: 'items', type: 'json', default: [1, 1, 2, 2] },
  { name: 'key', type: 'string', default: '' },
]" />

### multiply

Repeat all the items the given number of times.

Laravel: [`multiply()`](https://laravel.com/docs/collections#method-multiply)

The result is a list. A fraction in the number is dropped, and `0` gives an empty collection.

```js
import { collect } from "@tolki/collection";

collect([1, 2]).multiply(3).all();
// => [1, 2, 1, 2, 1, 2]

collect({ a: 1, b: 2 }).multiply(2).all();
// => [1, 2, 1, 2]

collect([1, 2]).multiply(2.5).all();
// => [1, 2, 1, 2]

collect([1, 2]).multiply(0).all();
// => []
```

<FnTry label="collect(items).multiply(multiplier)" :fn="(items, multiplier) => collect(items).multiply(multiplier).all()" :args="[
  { name: 'items', type: 'json', default: [1, 2] },
  { name: 'multiplier', type: 'number', default: 3 },
]" />

### nth

Take every n-th item, starting at an offset.

Laravel: [`nth()`](https://laravel.com/docs/collections#method-nth)

The result is a list, whatever keys the items had. A step below `1` throws an `InvalidArgumentException`.

```js
import { collect } from "@tolki/collection";

const letters = collect(["a", "b", "c", "d", "e", "f"]);

letters.nth(4).all();
// => ["a", "e"]

letters.nth(4, 1).all();
// => ["b", "f"]

collect([1, 2]).nth(0);
// => throws InvalidArgumentException
```

<FnTry label="collect(items).nth(step, offset)" :fn="(items, step, offset) => collect(items).nth(step, offset).all()" :args="[
  { name: 'items', type: 'json', default: ['a', 'b', 'c', 'd', 'e', 'f'] },
  { name: 'step', type: 'number', default: 4 },
  { name: 'offset', type: 'number', default: 0 },
]" />

### offsetExists

Determine whether an item exists at a key.

This is the method behind Laravel's `isset($c['a'])`. An item that is `null` counts as absent. See [Reading items](./differences.md#reading-items).

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3]).offsetExists(1);
// => true

collect([1, 2, 3]).offsetExists(3);
// => false

collect({ a: null }).offsetExists("a");
// => false
```

<FnTry label="collect(items).offsetExists(key)" :fn="(items, key) => collect(items).offsetExists(key)" :args="[
  { name: 'items', type: 'json', default: { a: 1, b: 2 } },
  { name: 'key', type: 'string', default: 'a' },
]" />

### offsetGet

Get the item at a key.

This is the method behind Laravel's `$c['a']`; a collection has no `c.a` or `c[0]`. A missing key gives `undefined`, where [`get`](#get) takes a default. See [Reading items](./differences.md#reading-items).

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3]).offsetGet(1);
// => 2

collect({ a: 1, b: 2 }).offsetGet("a");
// => 1

collect({ a: 1, b: 2 }).offsetGet("c");
// => undefined
```

<FnTry label="collect(items).offsetGet(key)" :fn="(items, key) => collect(items).offsetGet(key)" :args="[
  { name: 'items', type: 'json', default: { a: 1, b: 2 } },
  { name: 'key', type: 'string', default: 'a' },
]" />

### offsetSet

Set the item at a key, or append it when the key is `null`.

This is the method behind Laravel's `$c['a'] = 1` and `$c[] = 1`. See [Reading items](./differences.md#reading-items).

::: warning
Unlike most other collection methods, `offsetSet` does not return a new modified collection; it modifies the collection it is called on, and returns nothing.
:::

```js
import { collect } from "@tolki/collection";

const items = collect([1, 2]);

items.offsetSet(null, 3);

items.all();
// => [1, 2, 3]

items.offsetSet(1, 4);

items.all();
// => [1, 4, 3]

items.offsetSet(5, "x");

items.all();
// => { 0: 1, 1: 4, 2: 3, 5: "x" }
```

<FnTry label="collect(items).offsetSet(key, value)" :fn="(items, key, value) => { const c = collect(items); c.offsetSet(key, value); return c.all(); }" :args="[
  { name: 'items', type: 'json', default: [1, 2] },
  { name: 'key', type: 'json', default: 1 },
  { name: 'value', type: 'json', default: 4 },
]" />

### offsetUnset

Remove the item at a key.

This is the method behind Laravel's `unset($c['a'])`. A key that is not there changes nothing. See [Reading items](./differences.md#reading-items).

<!-- docs/php-parity/Collection/offsetUnset.json, "offsetUnset-list-gap-keys" -->

::: info
A list stays a list, so the items after the removed one move down a key. In Laravel they keep the keys they had. See [Keys and order](./differences.md#keys-and-order).
:::

::: warning
Unlike most other collection methods, `offsetUnset` does not return a new modified collection; it modifies the collection it is called on, and returns nothing.
:::

```js
import { collect } from "@tolki/collection";

const items = collect([1, 2, 3]);

items.offsetUnset(1);

items.all();
// => [1, 3]

const keyed = collect({ a: 1, b: 2 });

keyed.offsetUnset("a");
// => undefined

keyed.all();
// => { b: 2 }

keyed.offsetUnset("missing");

keyed.all();
// => { b: 2 }
```

<FnTry label="collect(items).offsetUnset(key)" :fn="(items, key) => { const c = collect(items); c.offsetUnset(key); return c.all(); }" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3] },
  { name: 'key', type: 'json', default: 1 },
]" />

### only

Get the items with the given keys.

Laravel: [`only()`](https://laravel.com/docs/collections#method-only)

Pass the keys as an array or a collection, or as separate arguments. Each key is taken as it is, so `"a.b"` does not reach a nested value. A key the collection lacks is skipped, and `null` returns every item. For the inverse, see [except](#except). The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#only).

```js
import { collect } from "@tolki/collection";

collect({ product_id: 1, name: "Desk", price: 100, discount: false })
  .only(["product_id", "name"])
  .all();
// => { product_id: 1, name: "Desk" }

collect({ a: 1, b: 2, c: 3 }).only("a", "c").all();
// => { a: 1, c: 3 }

collect([1, 2, 3]).only(0, 2).all();
// => [1, 3]

collect({ a: { b: 1 } })
  .only("a.b")
  .all();
// => {}

collect({ a: 1, b: 2 }).only(null).all();
// => { a: 1, b: 2 }
```

<FnTry label="collect(items).only(keys)" :fn="(items, keys) => collect(items).only(keys).all()" :args="[
  { name: 'items', type: 'json', default: { product_id: 1, name: 'Desk', price: 100, discount: false } },
  { name: 'keys', type: 'json', default: ['product_id', 'name'] },
]" />

### pad

Fill the collection with a value until it reaches a size.

Laravel: [`pad()`](https://laravel.com/docs/collections#method-pad)

A positive size pads at the end, and a negative size pads at the beginning. Nothing is added when the size, ignoring its sign, is no more than the number of items. When the collection grows, its integer keys are renumbered from 0 in order, pad slots included, and its string keys are kept. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#pad).

```js
import { collect } from "@tolki/collection";

const letters = collect(["A", "B", "C"]);

letters.pad(5, 0).all();
// => ["A", "B", "C", 0, 0]

letters.pad(-5, 0).all();
// => [0, 0, "A", "B", "C"]

letters.pad(2, 0).all();
// => ["A", "B", "C"]

collect({ a: 1, b: 2 }).pad(-4, 0).all();
// => { 0: 0, 1: 0, a: 1, b: 2 }
```

<FnTry label="collect(items).pad(size, value)" :fn="(items, size, value) => collect(items).pad(size, value).all()" :args="[
  { name: 'items', type: 'json', default: ['A', 'B', 'C'] },
  { name: 'size', type: 'number', default: 5 },
  { name: 'value', type: 'json', default: 0 },
]" />

### partition

Separate the items that pass a truth test from those that do not.

Laravel: [`partition()`](https://laravel.com/docs/collections#method-partition)

The result is a collection of two collections: the items that pass, then the rest. Destructure it, or read `[0]` and `[1]`. Pass a callback, a key to test for truthiness, or a key with an operator and a value, as `where` does. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#partition).

<!-- docs/php-parity/Collection/partition.json, "partition-list-keys" -->

::: info
A list stays a list, so each half is renumbered from 0. In Laravel each half keeps the keys its items had. See [Keys and order](./differences.md#keys-and-order).
:::

```js
import { collect } from "@tolki/collection";

const [underThree, equalOrAboveThree] = collect([1, 2, 3, 4, 5, 6]).partition(
  (i) => i < 3,
);

underThree.all();
// => [1, 2]

equalOrAboveThree.all();
// => [3, 4, 5, 6]

const [active, inactive] = collect([
  { name: "Ann", active: true },
  { name: "Ben", active: false },
]).partition("active");

active.toArray();
// => [{ name: "Ann", active: true }]

inactive.toArray();
// => [{ name: "Ben", active: false }]

const [adults] = collect([{ age: 12 }, { age: 30 }]).partition("age", ">", 18);

adults.toArray();
// => [{ age: 30 }]
```

<FnTry label="collect(items).partition(callback)" :fn="(items, callback) => collect(items).partition(callback).toArray()" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3, 4, 5, 6] },
  { name: 'callback', type: 'select', default: predicates[0].value, options: predicates },
]" />

### percentage

Get the percentage of items that pass a truth test.

Laravel: [`percentage()`](https://laravel.com/docs/collections#method-percentage)

The answer is rounded to two decimal places. Pass a precision as the second argument to change that. An empty collection gives `null`.

```js
import { collect } from "@tolki/collection";

const numbers = collect([1, 1, 2, 2, 2, 3]);

numbers.percentage((value) => value === 1);
// => 33.33

numbers.percentage((value) => value === 1, 3);
// => 33.333

numbers.percentage((value) => value === 1, 0);
// => 33

collect([]).percentage((value) => value === 1);
// => null
```

<FnTry label="collect(items).percentage(callback, precision)" :fn="(items, callback, precision) => collect(items).percentage(callback, precision)" :args="[
  { name: 'items', type: 'json', default: [1, 1, 2, 2, 2, 3] },
  { name: 'callback', type: 'select', default: predicates[2].value, options: predicates },
  { name: 'precision', type: 'number', default: 2 },
]" />

### pipe

Pass the collection to a callback and return what the callback returns.

Laravel: [`pipe()`](https://laravel.com/docs/collections#method-pipe)

The result can be any value, not only a collection.

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3]).pipe((collection) => collection.sum());
// => 6

collect([1, 2, 3]).pipe((collection) => collection.count());
// => 3
```

<FnTry label="collect(items).pipe(callback)" :fn="(items, callback) => collect(items).pipe(callback)" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3] },
  { name: 'callback', type: 'select', default: pipeCallbacks[0].value, options: pipeCallbacks },
]" />

### pipeInto

Create a new instance of a class, passing the collection to its constructor.

Laravel: [`pipeInto()`](https://laravel.com/docs/collections#method-pipeinto)

Unlike [mapInto](#mapinto), which makes one instance per item, `pipeInto` makes one instance from the whole collection.

```js
import { collect } from "@tolki/collection";

class ResourceCollection {
  constructor(collection) {
    this.collection = collection;
  }
}

const resource = collect([1, 2, 3]).pipeInto(ResourceCollection);

resource instanceof ResourceCollection;
// => true

resource.collection.all();
// => [1, 2, 3]
```

### pipeThrough

Pass the collection through a list of callbacks and return the last result.

Laravel: [`pipeThrough()`](https://laravel.com/docs/collections#method-pipethrough)

The first callback receives the collection, and each one after it receives what the one before it returned.

<!-- docs/php-parity/Collection/pipeThrough.json, "C32-H-pipeThrough-empty-returns-receiver" -->

An empty list returns the collection itself, as it does in Laravel.

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3]).pipeThrough([
  (collection) => collection.merge([4, 5]),
  (collection) => collection.sum(),
]);
// => 15

const items = collect([1, 2, 3]);

items.pipeThrough([]) === items;
// => true
```

<FnTry label="collect(items).pipeThrough(callbacks)" :fn="(items, callbacks) => collect(items).pipeThrough(callbacks)" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3] },
  { name: 'callbacks', type: 'select', default: pipeThroughCallbacks[0].value, options: pipeThroughCallbacks },
]" />

### pluck

Get the values of a key from every item.

Laravel: [`pluck()`](https://laravel.com/docs/collections#method-pluck)

Pass a second argument to key the result by another field. If several items give the same key, the last one wins. The key can be a path in "dot" notation, with `*` for every element of a list: see [Dot Notation](../arrays-objects/dot-notation.md) and [Wildcards](../arrays-objects/dot-notation.md#wildcards). Either argument can be a callback that receives the item instead. An item without the key gives `null`. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#pluck).

```js
import { collect } from "@tolki/collection";

const products = collect([
  { product_id: "prod-100", name: "Desk" },
  { product_id: "prod-200", name: "Chair" },
]);

products.pluck("name").all();
// => ["Desk", "Chair"]

products.pluck("name", "product_id").all();
// => { "prod-100": "Desk", "prod-200": "Chair" }

collect([
  { brand: "Tesla", color: "red" },
  { brand: "Pagani", color: "white" },
  { brand: "Tesla", color: "black" },
  { brand: "Pagani", color: "orange" },
])
  .pluck("color", "brand")
  .all();
// => { Tesla: "black", Pagani: "orange" }

collect([
  { name: "Laracon", speakers: { first_day: ["Rosa", "Judith"] } },
  { name: "VueConf", speakers: { first_day: ["Abigail", "Joey"] } },
])
  .pluck("speakers.first_day")
  .all();
// => [["Rosa", "Judith"], ["Abigail", "Joey"]]

collect([{ tags: [{ id: 1 }, { id: 2 }] }, { tags: [{ id: 3 }] }])
  .pluck("tags.*.id")
  .all();
// => [[1, 2], [3]]

collect([{ name: "Desk" }])
  .pluck((item) => item.name.toUpperCase())
  .all();
// => ["DESK"]

collect([{ name: "Desk" }, { price: 5 }])
  .pluck("name")
  .all();
// => ["Desk", null]
```

<FnTry label="collect(items).pluck(value, key)" :fn="(items, value, key) => collect(items).pluck(value, key || null).all()" :args="[
  { name: 'items', type: 'json', default: [{ product_id: 'prod-100', name: 'Desk' }, { product_id: 'prod-200', name: 'Chair' }] },
  { name: 'value', type: 'string', default: 'name' },
  { name: 'key', type: 'string', default: 'product_id' },
]" />

### pop

Remove and return the last item, or the last several items.

Laravel: [`pop()`](https://laravel.com/docs/collections#method-pop)

Without a count, `pop` returns the last item, or `null` for an empty collection. A count of 1 does the same. A count of 2 or more returns a new collection of that many items from the end, last first, and a count of `0` or below returns an empty collection and removes nothing. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#pop).

::: warning
Unlike most other collection methods, `pop` does not return a new modified collection; it modifies the collection it is called on, and returns the item or items it removed.
:::

```js
import { collect } from "@tolki/collection";

const items = collect([1, 2, 3, 4, 5]);

items.pop();
// => 5

items.all();
// => [1, 2, 3, 4]

items.pop(3).all();
// => [4, 3, 2]

items.all();
// => [1]

items.pop(1);
// => 1

items.pop(0).all();
// => []

items.pop(-1).all();
// => []

items.all();
// => []

collect([]).pop();
// => null
```

<FnTry label="collect(items).pop(count)" :fn="(items, count) => { const c = collect(items); const popped = c.pop(count); return { popped: popped instanceof Collection ? popped.all() : popped, left: c.all() }; }" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3, 4, 5] },
  { name: 'count', type: 'number', default: 2 },
]" />

### prepend

Add an item to the beginning of the collection.

Laravel: [`prepend()`](https://laravel.com/docs/collections#method-prepend)

Pass a second argument to give the item a key. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#prepend), where it returns a new value and leaves the original unchanged.

<!-- docs/php-parity/Collection/prepend.json, "order-prepend-with-null-key" -->

A `null` or `undefined` key files the item under the empty string `""`, as it does in Laravel.

::: warning
Unlike most other collection methods, `prepend` does not return a new modified collection; it modifies and returns the collection it is called on.
:::

```js
import { collect } from "@tolki/collection";

const numbers = collect([1, 2, 3, 4, 5]);

numbers.prepend(0).all();
// => [0, 1, 2, 3, 4, 5]

numbers.all();
// => [0, 1, 2, 3, 4, 5]

collect({ one: 1, two: 2 }).prepend(0, "zero").all();
// => { zero: 0, one: 1, two: 2 }

collect([1]).prepend(0, null).keys().all();
// => ["", 0]
```

<FnTry label="collect(items).prepend(value, key)" :fn="(items, value, key) => (key ? collect(items).prepend(value, key) : collect(items).prepend(value)).all()" :args="[
  { name: 'items', type: 'json', default: { one: 1, two: 2 } },
  { name: 'value', type: 'json', default: 0 },
  { name: 'key', type: 'string', default: 'zero' },
]" />

### pull

Remove an item by key and return it.

Laravel: [`pull()`](https://laravel.com/docs/collections#method-pull)

The second argument is returned when the key is missing; it may be a callback. A key with dots reaches into nested arrays and objects, and removes the value there. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#pull), where it returns a new value and leaves the original unchanged.

<!-- docs/php-parity/Collection/pull.json, "pull-list-gap-keys" -->

::: info
A list stays a list, so the items after the removed one move down a key. In Laravel they keep the keys they had. See [Keys and order](./differences.md#keys-and-order).
:::

::: warning
Unlike most other collection methods, `pull` does not return a new modified collection; it modifies the collection it is called on, and returns the item it removed.
:::

```js
import { collect } from "@tolki/collection";

const product = collect({ product_id: "prod-100", name: "Desk" });

product.pull("name");
// => "Desk"

product.all();
// => { product_id: "prod-100" }

product.pull("price", 0);
// => 0

collect({ a: { b: 1, c: 2 } }).pull("a.b");
// => 1

const prices = collect([10, 20, 30, 40]);

prices.pull(1);
// => 20

prices.all();
// => [10, 30, 40]
```

<FnTry label="collect(items).pull(key, defaultValue)" :fn="(items, key, defaultValue) => { const c = collect(items); const pulled = c.pull(key, defaultValue); return { pulled, left: c.all() }; }" :args="[
  { name: 'items', type: 'json', default: { product_id: 'prod-100', name: 'Desk' } },
  { name: 'key', type: 'string', default: 'name' },
  { name: 'defaultValue', type: 'json', default: null },
]" />

### push

Add one or more items to the end of the collection.

Laravel: [`push()`](https://laravel.com/docs/collections#method-push)

On a keyed collection, each item is stored under the next free integer key. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#push), where it returns a new value and leaves the original unchanged.

::: warning
Unlike most other collection methods, `push` does not return a new modified collection; it modifies and returns the collection it is called on.
:::

```js
import { collect } from "@tolki/collection";

const numbers = collect([1, 2, 3, 4]);

numbers.push(5).all();
// => [1, 2, 3, 4, 5]

numbers.push(6, 7).all();
// => [1, 2, 3, 4, 5, 6, 7]

numbers.all();
// => [1, 2, 3, 4, 5, 6, 7]

collect({ a: 1 }).push(2).all();
// => { 0: 2, a: 1 }
```

<FnTry label="collect(items).push(value)" :fn="(items, value) => collect(items).push(value).all()" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3, 4] },
  { name: 'value', type: 'json', default: 5 },
]" />

### put

Set the item at a key.

Laravel: [`put()`](https://laravel.com/docs/collections#method-put)

The key is added when it is new and overwritten when it exists. On a list, `put` at the next integer key appends, and any other key makes the collection keyed. See [Keys and order](./differences.md#keys-and-order).

::: warning
Unlike most other collection methods, `put` does not return a new modified collection; it modifies and returns the collection it is called on.
:::

```js
import { collect } from "@tolki/collection";

const product = collect({ product_id: 1, name: "Desk" });

product.put("price", 100).all();
// => { product_id: 1, name: "Desk", price: 100 }

product.put("name", "Chair").all();
// => { product_id: 1, name: "Chair", price: 100 }

product.all();
// => { product_id: 1, name: "Chair", price: 100 }

collect([1, 2]).put(2, 3).all();
// => [1, 2, 3]
```

<FnTry label="collect(items).put(key, value)" :fn="(items, key, value) => collect(items).put(key, value).all()" :args="[
  { name: 'items', type: 'json', default: { product_id: 1, name: 'Desk' } },
  { name: 'key', type: 'json', default: 'price' },
  { name: 'value', type: 'json', default: 100 },
]" />

### random

Get one random item, or several.

Laravel: [`random()`](https://laravel.com/docs/collections#method-random)

Without an argument, `random` returns one item. With a count, it returns a collection of that many items, and it throws an `InvalidArgumentException` when the collection has fewer. The count can be a callback that receives the collection and returns the count. The picked items come back as a list; pass `true` as the second argument to keep their keys, which [Keys and order](./differences.md#keys-and-order) explains. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#random).

```js
import { collect } from "@tolki/collection";

const numbers = collect([1, 2, 3, 4, 5]);

numbers.random();
// e.g. 4

[1, 2, 3, 4, 5].includes(numbers.random());
// => true

numbers.random(3).all();
// e.g. [2, 4, 5]

numbers.random(3).count();
// => 3

numbers.random((items) => Math.min(10, items.count())).count();
// => 5

numbers.random(6);
// => throws InvalidArgumentException

collect({ a: 1, b: 2, c: 3 }).random(2).keys().all();
// => [0, 1]

collect({ a: 1, b: 2, c: 3 }).random(2, true).count();
// => 2
```

### range

Create a collection of numbers between two values.

Laravel: [`range()`](https://laravel.com/docs/collections#method-range)

The static `range` method counts from the first number to the second, including both. It counts down when the second number is lower. A third argument sets the step, which is always positive on an increasing range and may be negative on a decreasing one. It throws an `Error` for a step of `0`, a negative step on an increasing range, or a step larger than the range. Laravel's docs call `range` on an instance, as `collect()->range(3, 6)`. Here it is static only.

```js
import { Collection } from "@tolki/collection";

Collection.range(3, 6).all();
// => [3, 4, 5, 6]

Collection.range(1, 10, 2).all();
// => [1, 3, 5, 7, 9]

Collection.range(5, 1).all();
// => [5, 4, 3, 2, 1]

Collection.range(0, 1, 0.25).all();
// => [0, 0.25, 0.5, 0.75, 1]

Collection.range(1, 5, 0);
// => throws Error
```

<FnTry label="Collection.range(from, to, step)" :fn="(from, to, step) => Collection.range(from, to, step).all()" :args="[
  { name: 'from', type: 'number', default: 3 },
  { name: 'to', type: 'number', default: 6 },
  { name: 'step', type: 'number', default: 1 },
]" />

### reduce

Reduce the collection to a single value.

Laravel: [`reduce()`](https://laravel.com/docs/collections#method-reduce)

The callback receives the result of the last call, the item and its key, and returns the new result. Pass a second argument for the starting result. Without one, the first call receives `null`, so the first item reaches the callback too, unlike `Array.prototype.reduce`. An empty collection gives the starting result, or `null` without one.

```js
import { collect } from "@tolki/collection";

const numbers = collect([1, 2, 3]);

numbers.reduce((carry, item) => carry + item, 0);
// => 6

numbers.reduce((carry, item) => carry + item, 4);
// => 10

numbers.reduce((carry, item) => (carry ?? 0) + item);
// => 6

collect([]).reduce((carry, item) => carry + item);
// => null

const ratio = { usd: 1, gbp: 1.37, eur: 1.22 };

collect({ usd: 1400, gbp: 1200, eur: 1000 }).reduce(
  (carry, value, key) => carry + value * ratio[key],
  0,
);
// => 4264
```

<FnTry label="collect(items).reduce(callback, initial)" :fn="(items, callback, initial) => collect(items).reduce(callback, initial)" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3] },
  { name: 'callback', type: 'select', default: reduceCallbacks[0].value, options: reduceCallbacks },
  { name: 'initial', type: 'json', default: 0 },
]" />

### reduceInto

Reduce the collection into a starting value by changing that value.

Laravel: [`reduceInto()`](https://laravel.com/docs/collections#method-reduce-into)

Unlike [reduce](#reduce), the callback need not return the result. It receives the starting value, the item and its key, and changes the starting value in place. `reduceInto` returns the starting value.

JavaScript cannot change a number or a string in place, so the callback may return the new value instead. Returning nothing keeps the current one. See [JavaScript-only additions](./differences.md#javascript-only-additions).

```js
import { collect } from "@tolki/collection";

class OrderStats {
  total = 0;
  count = 0;
}

const orders = collect([{ amount: 100 }, { amount: 250 }, { amount: 50 }]);

const stats = orders.reduceInto(new OrderStats(), (stats, order) => {
  stats.total += order.amount;
  stats.count++;
});

stats.total;
// => 400

stats.count;
// => 3

collect([1, 2, 3, 4, 5]).reduceInto([], (result, value) => {
  if (value % 2 === 0) {
    result.push(value);
  }
});
// => [2, 4]

collect([1, 2, 3, 4, 5]).reduceInto(0, (total, value) => total + value);
// => 15
```

<FnTry label="collect(items).reduceInto(initial, callback)" :fn="(items, initial, callback) => collect(items).reduceInto(initial, callback)" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3, 4, 5] },
  { name: 'initial', type: 'json', default: 0 },
  { name: 'callback', type: 'select', default: reduceIntoCallbacks[0].value, options: reduceIntoCallbacks },
]" />

### reduceSpread

Reduce the collection to several values at once.

Laravel: [`reduceSpread()`](https://laravel.com/docs/collections#method-reduce-spread)

Pass the starting values after the callback. The callback receives those values, then the item and its key, and must return an array with the next values. `reduceSpread` returns the final array. It throws an `UnexpectedValueException` when the callback returns anything else.

```js
import { collect } from "@tolki/collection";

const costs = collect([5, 6, 2]);

const [creditsRemaining, batch] = costs.reduceSpread(
  (credits, batch, cost) => {
    if (credits >= cost) {
      batch.push(cost);
      credits -= cost;
    }

    return [credits, batch];
  },
  8,
  [],
);

creditsRemaining;
// => 1

batch;
// => [5, 2]

collect([1]).reduceSpread(() => false, 0);
// => throws UnexpectedValueException
```

<FnTry label="collect(items).reduceSpread(callback, ...initial)" :fn="(items, callback, initial) => collect(items).reduceSpread(callback, ...initial)" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3] },
  { name: 'callback', type: 'select', default: spreadReducers[0].value, options: spreadReducers },
  { name: 'initial', type: 'json', default: [0, 0] },
]" />

### reduceWithKeys

Reduce a keyed collection to a single value.

It does what [reduce](#reduce) does, which already hands the callback each item's key.

```js
import { collect } from "@tolki/collection";

collect({ a: 1, b: 2 }).reduceWithKeys(
  (carry, value, key) => carry + key + value,
  "",
);
// => "a1b2"

collect([1, 2, 3]).reduceWithKeys((carry, value) => carry + value, 0);
// => 6
```

<FnTry label="collect(items).reduceWithKeys(callback, initial)" :fn="(items, initial) => collect(items).reduceWithKeys((carry, value, key) => carry + key + value, initial)" :args="[
  { name: 'items', type: 'json', default: { a: 1, b: 2 } },
  { name: 'initial', type: 'json', default: '' },
]" />

### reject

Remove the items that pass a truth test.

Laravel: [`reject()`](https://laravel.com/docs/collections#method-reject)

The callback receives the item and its key, and the items it answers truthy for are removed. Pass a value instead to remove each item equal to it, compared loosely (see [Loose and strict comparison](../arrays-objects/php-semantics.md#loose-and-strict-comparison)). With no argument, `reject` removes every item that is truthy by [PHP's rules](../arrays-objects/php-semantics.md#truthiness). For the inverse, see [filter](#filter). The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#reject).

<!-- docs/php-parity/Collection/reject.json, "reject-list-gap-keys" -->

::: info
A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](./differences.md#keys-and-order).
:::

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3, 4])
  .reject((value, key) => value > 2)
  .all();
// => [1, 2]

collect([1, 2, 3, 2]).reject(2).all();
// => [1, 3]

collect([1, null, 2, false, 3, ""]).reject().all();
// => [null, false, ""]

collect({ a: 1, b: 2, c: 3 })
  .reject((value, key) => key === "b")
  .all();
// => { a: 1, c: 3 }
```

<FnTry label="collect(items).reject(callback)" :fn="(items, callback) => collect(items).reject(callback).all()" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3, 4] },
  { name: 'callback', type: 'select', default: predicates[0].value, options: predicates },
]" />

### replace

Replace items by key.

Laravel: [`replace()`](https://laravel.com/docs/collections#method-replace)

`replace` works like [merge](#merge), but it also overwrites items with matching integer keys. It returns a new collection, and a key the original lacks is added. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#replace).

```js
import { collect } from "@tolki/collection";

const names = collect(["Taylor", "Abigail", "James"]);

names.replace({ 1: "Victoria", 3: "Finn" }).all();
// => ["Taylor", "Victoria", "James", "Finn"]

names.all();
// => ["Taylor", "Abigail", "James"]

collect({ name: "amir", family: "otwell" })
  .replace({ name: "taylor", age: 26 })
  .all();
// => { name: "taylor", family: "otwell", age: 26 }
```

<FnTry label="collect(items).replace(replacement)" :fn="(items, replacement) => collect(items).replace(replacement).all()" :args="[
  { name: 'items', type: 'json', default: ['Taylor', 'Abigail', 'James'] },
  { name: 'replacement', type: 'json', default: { 1: 'Victoria', 3: 'Finn' } },
]" />

### replaceRecursive

Replace items by key, going into nested arrays and objects.

Laravel: [`replaceRecursive()`](https://laravel.com/docs/collections#method-replacerecursive)

`replaceRecursive` works like [replace](#replace), but it goes into nested arrays and objects and applies the same replacement to the inner values. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#replacerecursive).

```js
import { collect } from "@tolki/collection";

collect(["Taylor", "Abigail", ["James", "Victoria", "Finn"]])
  .replaceRecursive({ 0: "Charlie", 2: { 1: "King" } })
  .all();
// => ["Charlie", "Abigail", ["James", "King", "Finn"]]

collect({ a: { b: 1 } })
  .replaceRecursive({ a: { c: 2 } })
  .all();
// => { a: { b: 1, c: 2 } }
```

<FnTry label="collect(items).replaceRecursive(replacement)" :fn="(items, replacement) => collect(items).replaceRecursive(replacement).all()" :args="[
  { name: 'items', type: 'json', default: { a: { b: 1 } } },
  { name: 'replacement', type: 'json', default: { a: { c: 2 } } },
]" />

### reverse

Reverse the order of the items.

Laravel: [`reverse()`](https://laravel.com/docs/collections#method-reverse)

It returns a new collection. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#reverse).

<!-- docs/php-parity/Collection/reverse.json, "reverse over the same fixture" -->

::: info
Integer keys are renumbered from 0 in the new order, and string keys are kept. In Laravel every key is kept. See [Keys and order](./differences.md#keys-and-order).
:::

```js
import { collect } from "@tolki/collection";

const letters = collect(["a", "b", "c", "d", "e"]);

letters.reverse().all();
// => ["e", "d", "c", "b", "a"]

letters.reverse().keys().all();
// => [0, 1, 2, 3, 4]

letters.all();
// => ["a", "b", "c", "d", "e"]

collect({ a: 1, b: 2, c: 3 }).reverse().all();
// => { c: 3, b: 2, a: 1 }
```

<FnTry label="collect(items).reverse()" :fn="(items) => collect(items).reverse().all()" :args="[
  { name: 'items', type: 'json', default: ['a', 'b', 'c', 'd', 'e'] },
]" />

### search

Find the key of the first item that matches a value.

Laravel: [`search()`](https://laravel.com/docs/collections#method-search)

It returns the key of the match, or `false` when nothing matches. The search is loose by default, so `"4"` finds `4` (see [Loose and strict comparison](../arrays-objects/php-semantics.md#loose-and-strict-comparison)). Pass `true` as the second argument to compare strictly, or pass a callback to find the first item that passes a test. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#search).

```js
import { collect } from "@tolki/collection";

const numbers = collect([2, 4, 6, 8]);

numbers.search(4);
// => 1

numbers.search("4");
// => 1

numbers.search("4", true);
// => false

numbers.search((item, key) => item > 5);
// => 2

collect({ a: 1, b: 2 }).search(2);
// => "b"
```

<FnTry label="collect(items).search(value, strict)" :fn="(items, value, strict) => collect(items).search(value, strict)" :args="[
  { name: 'items', type: 'json', default: [2, 4, 6, 8] },
  { name: 'value', type: 'json', default: 4 },
  { name: 'strict', type: 'boolean', default: false },
]" />

### select

Keep only the given keys of each item.

Laravel: [`select()`](https://laravel.com/docs/collections#method-select)

It works like an SQL `SELECT`: where [only](#only) picks items by their key in the collection, `select` picks keys inside every item. Pass the keys as an array or a collection, or as separate arguments. A key an item lacks is skipped. The keys are exact, not paths, so `"details.age"` does not reach into `details`, and Laravel does the same. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#select).

<!-- docs/php-parity/Collection/select.json, "C32-D-select-dot-path-literal" -->

```js
import { collect } from "@tolki/collection";

const users = collect([
  { name: "Taylor Otwell", role: "Developer", status: "active" },
  { name: "Victoria Faith", role: "Researcher", status: "active" },
]);

users.select(["name", "role"]).all();
// => [
//   { name: "Taylor Otwell", role: "Developer" },
//   { name: "Victoria Faith", role: "Researcher" },
// ]

users.select("name").all();
// => [{ name: "Taylor Otwell" }, { name: "Victoria Faith" }]

collect({ a: { id: 1, name: "x" }, b: { id: 2, name: "y" } })
  .select("id")
  .all();
// => { a: { id: 1 }, b: { id: 2 } }

collect([{ id: 1, details: { age: 30 } }])
  .select(["id", "details.age"])
  .all();
// => [{ id: 1 }]
```

<FnTry label="collect(items).select(keys)" :fn="(items, keys) => collect(items).select(keys).all()" :args="[
  { name: 'items', type: 'json', default: [{ name: 'Taylor Otwell', role: 'Developer', status: 'active' }, { name: 'Victoria Faith', role: 'Researcher', status: 'active' }] },
  { name: 'keys', type: 'json', default: ['name', 'role'] },
]" />

### shift

Remove and return the first item, or the first several items.

Laravel: [`shift()`](https://laravel.com/docs/collections#method-shift)

Without a count, `shift` returns the first item, or `null` for an empty collection. A count of 1 does the same. A count of 2 or more returns a new collection of that many items from the start, and a count of `0` returns an empty collection and removes nothing. A negative count throws an `InvalidArgumentException`. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#shift).

::: warning
Unlike most other collection methods, `shift` does not return a new modified collection; it modifies the collection it is called on, and returns the item or items it removed.
:::

```js
import { collect } from "@tolki/collection";

const items = collect([1, 2, 3, 4, 5]);

items.shift();
// => 1

items.all();
// => [2, 3, 4, 5]

items.shift(3).all();
// => [2, 3, 4]

items.all();
// => [5]

items.shift(1);
// => 5

items.shift(0).all();
// => []

collect([]).shift();
// => null

collect([1]).shift(-1);
// => throws InvalidArgumentException
```

<FnTry label="collect(items).shift(count)" :fn="(items, count) => { const c = collect(items); const shifted = c.shift(count); return { shifted: shifted instanceof Collection ? shifted.all() : shifted, left: c.all() }; }" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3, 4, 5] },
  { name: 'count', type: 'number', default: 2 },
]" />

### shuffle

Put the items in a random order.

Laravel: [`shuffle()`](https://laravel.com/docs/collections#method-shuffle)

It returns a new collection and leaves the original as it was. The result is a list, whatever keys the items had. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#shuffle).

```js
import { collect } from "@tolki/collection";

const numbers = collect([1, 2, 3, 4, 5]);

numbers.shuffle().all();
// e.g. [3, 2, 5, 1, 4]

numbers.shuffle().sort().all();
// => [1, 2, 3, 4, 5]

numbers.all();
// => [1, 2, 3, 4, 5]

collect({ a: 1, b: 2, c: 3 }).shuffle().keys().all();
// => [0, 1, 2]
```

### skip

Remove the given number of items from the beginning.

Laravel: [`skip()`](https://laravel.com/docs/collections#method-skip)

It returns a new collection. A count above the number of items gives an empty collection.

<!-- docs/php-parity/Collection/skip.json, "skip-list-keys" -->

::: info
A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](./differences.md#keys-and-order).
:::

```js
import { collect } from "@tolki/collection";

const numbers = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

numbers.skip(4).all();
// => [5, 6, 7, 8, 9, 10]

collect([1, 2]).skip(5).all();
// => []

collect({ a: 1, b: 2, c: 3 }).skip(1).all();
// => { b: 2, c: 3 }
```

<FnTry label="collect(items).skip(count)" :fn="(items, count) => collect(items).skip(count).all()" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  { name: 'count', type: 'number', default: 4 },
]" />

### skipUntil

Skip items until one passes a test or equals a value.

Laravel: [`skipUntil()`](https://laravel.com/docs/collections#method-skipuntil)

Pass a callback, which receives the item and its key, or a value. A value is compared strictly, so `"3"` does not match `3`. The item that stops the skipping and every item after it are returned. If nothing stops it, the result is an empty collection. The same operation on plain arrays and objects is in the [utilities list](../arrays-objects/utilities-list.md#skipuntil).

<!-- docs/php-parity/Collection/skipUntil.json, "C32-D-skipUntil-list-keys" -->

::: info
A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](./differences.md#keys-and-order).
:::

```js
import { collect } from "@tolki/collection";

const numbers = collect([1, 2, 3, 4]);

numbers.skipUntil((item) => item >= 3).all();
// => [3, 4]

numbers.skipUntil(3).all();
// => [3, 4]

numbers.skipUntil("3").all();
// => []

numbers.skipUntil(9).all();
// => []

collect({ a: 1, b: 2, c: 3 })
  .skipUntil((value, key) => key === "b")
  .all();
// => { b: 2, c: 3 }
```

<FnTry label="collect(items).skipUntil(callback)" :fn="(items, callback) => collect(items).skipUntil(callback).all()" :args="[
  { name: 'items', type: 'json', default: [1, 2, 3, 4] },
  { name: 'callback', type: 'select', default: predicates[0].value, options: predicates },
]" />
