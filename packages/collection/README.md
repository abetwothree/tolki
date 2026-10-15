<p align="center"><img src="https://raw.githubusercontent.com/abetwothree/tolki/refs/heads/master/docs/vitepress/public/tolki-logo-short.svg" width="50%" alt="Laravel Tolki JS Logo"></p>

# Tolki JS Collection Package

This package provides a Collection class similar to Laravel's Collection class.

## Documentation

The full documentation for the collection utilities can be found at [https://tolki.abe.dev](https://tolki.abe.dev/collections/).

<!-- AUTO-GENERATED-DOCS:START -->

## Collection Utilities Installation

The [`@tolki/collection`](https://www.npmjs.com/package/@tolki/collection) package provides a fluent `Collection` class inspired by Laravel's `Collection`. You can install it via npm, yarn, or pnpm:

```bash [npm]
npm install @tolki/collection
```

```bash [yarn]
yarn add @tolki/collection
```

```bash [pnpm]
pnpm add @tolki/collection
```

### Creating collections

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

### Lists and keyed collections

A collection holds either a list or a keyed record. An array makes a list, and a plain object or a `Map` makes a keyed collection:

```js
import { collect } from "@tolki/collection";

collect(["a", "b"]).all();
// => ["a", "b"]

collect({ first: "a", second: "b" }).all();
// => { first: "a", second: "b" }
```

In TypeScript the class is `Collection<TValue, TKey, TShape>`. `TValue` is the item type and `TKey` the key type. `TShape` is `"list"`, `"keyed"` or `"partial"`: a list, a record that holds every key its type names, or one that may lack some. It defaults from the key type, so number keys give a list and any other key gives a keyed record. You rarely write it yourself, because `collect()` infers it.

### Methods that change the collection in place

Most methods return a new collection. The few that change the collection they are called on are listed here. Most also return it. `getOrPut` returns the value it found or stored, `pull` the item it removed, `pop` and `shift` the item or items they removed, `splice` the items it removed, and `offsetSet` and `offsetUnset` return nothing.

- [`add`](https://tolki.abe.dev/collections/methods-list.html#add)
- [`escapeWhenCastingToString`](https://tolki.abe.dev/collections/methods-list.html#escapewhencastingtostring)
- [`forget`](https://tolki.abe.dev/collections/methods-list.html#forget)
- [`getOrPut`](https://tolki.abe.dev/collections/methods-list.html#getorput)
- [`offsetSet`](https://tolki.abe.dev/collections/methods-list.html#offsetset)
- [`offsetUnset`](https://tolki.abe.dev/collections/methods-list.html#offsetunset)
- [`pop`](https://tolki.abe.dev/collections/methods-list.html#pop)
- [`prepend`](https://tolki.abe.dev/collections/methods-list.html#prepend)
- [`pull`](https://tolki.abe.dev/collections/methods-list.html#pull)
- [`push`](https://tolki.abe.dev/collections/methods-list.html#push)
- [`put`](https://tolki.abe.dev/collections/methods-list.html#put)
- [`shift`](https://tolki.abe.dev/collections/methods-list.html#shift)
- [`splice`](https://tolki.abe.dev/collections/methods-list.html#splice)
- [`transform`](https://tolki.abe.dev/collections/methods-list.html#transform)
- [`unshift`](https://tolki.abe.dev/collections/methods-list.html#unshift)

### More documentation

- The [Methods List](https://tolki.abe.dev/collections/methods-list.html) page documents every method with a live example.
- The [Differences from Laravel](https://tolki.abe.dev/collections/differences.html) page lists where the class departs from Laravel's, and why.
- Methods that take a path such as `pluck` read it as "dot" notation. The [Dot Notation](https://tolki.abe.dev/arrays-objects/dot-notation.html) page of [Arrays & Objects](https://tolki.abe.dev/arrays-objects/index.html) explains the rules.

## Tolki Collection Methods List

These are the methods of the `Collection` class. Every example builds a collection with [`collect()`](https://tolki.abe.dev/collections/index.html#creating-collections) and reads the items back with `all()` or [`toArray()`](#toarray). Each section ends with a box you can edit to try the method.

### Methods List

[add](#add) [after](#after) [all](#all) [average](#average) [avg](#avg) [before](#before) [chunk](#chunk) [chunkBy](#chunkby) [chunkWhile](#chunkwhile) [collapse](#collapse) [collapseWithKeys](#collapsewithkeys) [collect](#collect) [combine](#combine) [concat](#concat) [contains](#contains) [containsManyItems](#containsmanyitems) [containsOneItem](#containsoneitem) [containsStrict](#containsstrict) [count](#count) [countBy](#countby) [crossJoin](#crossjoin) [diff](#diff) [diffAssoc](#diffassoc) [diffAssocUsing](#diffassocusing) [diffKeys](#diffkeys) [diffKeysUsing](#diffkeysusing) [diffUsing](#diffusing) [doesntContain](#doesntcontain) [doesntContainStrict](#doesntcontainstrict) [dot](#dot) [dump](#dump) [duplicates](#duplicates) [duplicatesStrict](#duplicatesstrict) [each](#each) [eachSpread](#eachspread) [empty](#empty) [ensure](#ensure) [escapeWhenCastingToString](#escapewhencastingtostring) [every](#every) [except](#except) [filter](#filter) [first](#first) [firstOrFail](#firstorfail) [firstWhere](#firstwhere) [flatMap](#flatmap) [flatten](#flatten) [flip](#flip) [forget](#forget) [forPage](#forpage) [fromJson](#fromjson) [get](#get) [getIterator](#getiterator) [getOrPut](#getorput) [groupBy](#groupby) [has](#has) [hasAny](#hasany) [hasMany](#hasmany) [hasSole](#hassole) [implode](#implode) [intersect](#intersect) [intersectAssoc](#intersectassoc) [intersectAssocUsing](#intersectassocusing) [intersectByKeys](#intersectbykeys) [intersectUsing](#intersectusing) [isEmpty](#isempty) [isNotEmpty](#isnotempty) [join](#join) [jsonSerialize](#jsonserialize) [keyBy](#keyby) [keys](#keys) [last](#last) [length](#length) [make](#make) [map](#map) [mapInto](#mapinto) [mapSpread](#mapspread) [mapToDictionary](#maptodictionary) [mapToGroups](#maptogroups) [mapWithKeys](#mapwithkeys) [max](#max) [median](#median) [merge](#merge) [mergeRecursive](#mergerecursive) [min](#min) [mode](#mode) [multiply](#multiply) [nth](#nth) [offsetExists](#offsetexists) [offsetGet](#offsetget) [offsetSet](#offsetset) [offsetUnset](#offsetunset) [only](#only) [pad](#pad) [partition](#partition) [percentage](#percentage) [pipe](#pipe) [pipeInto](#pipeinto) [pipeThrough](#pipethrough) [pluck](#pluck) [pop](#pop) [prepend](#prepend) [pull](#pull) [push](#push) [put](#put) [random](#random) [range](#range) [reduce](#reduce) [reduceInto](#reduceinto) [reduceSpread](#reducespread) [reduceWithKeys](#reducewithkeys) [reject](#reject) [replace](#replace) [replaceRecursive](#replacerecursive) [reverse](#reverse) [search](#search) [select](#select) [shift](#shift) [shuffle](#shuffle) [skip](#skip) [skipUntil](#skipuntil) [skipWhile](#skipwhile) [slice](#slice) [sliding](#sliding) [sole](#sole) [some](#some) [sort](#sort) [sortBy](#sortby) [sortByDesc](#sortbydesc) [sortDesc](#sortdesc) [sortKeys](#sortkeys) [sortKeysDesc](#sortkeysdesc) [sortKeysUsing](#sortkeysusing) [splice](#splice) [split](#split) [splitIn](#splitin) [sum](#sum) [Symbol.iterator](#symboliterator) [Symbol.toPrimitive](#symboltoprimitive) [take](#take) [takeUntil](#takeuntil) [takeWhile](#takewhile) [tap](#tap) [times](#times) [toArray](#toarray) [toBase](#tobase) [toJson](#tojson) [toJSON](#tojson-1) [toPrettyJson](#toprettyjson) [toString](#tostring) [transform](#transform) [undot](#undot) [union](#union) [unique](#unique) [uniqueStrict](#uniquestrict) [unless](#unless) [unlessEmpty](#unlessempty) [unlessNotEmpty](#unlessnotempty) [unshift](#unshift) [unwrap](#unwrap) [value](#value) [values](#values) [when](#when) [whenEmpty](#whenempty) [whenNotEmpty](#whennotempty) [where](#where) [whereBetween](#wherebetween) [whereIn](#wherein) [whereInstanceOf](#whereinstanceof) [whereInStrict](#whereinstrict) [whereNotBetween](#wherenotbetween) [whereNotIn](#wherenotin) [whereNotInStrict](#wherenotinstrict) [whereNotNull](#wherenotnull) [whereNull](#wherenull) [whereStrict](#wherestrict) [wrap](#wrap) [zip](#zip)

### Methods Details

#### add

Add an item to the end of the collection, under the next free integer key.

The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#add).

Unlike most other collection methods, `add` does not return a new modified collection; it modifies and returns the collection it is called on.

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

#### after

Get the item after the given item, or `null` when the item is not found or is the last one.

Laravel: [`after()`](https://laravel.com/docs/collections#method-after)

The search is loose by default, so `"4"` finds `4` (see [Loose and strict comparison](https://tolki.abe.dev/arrays-objects/php-semantics.html#loose-and-strict-comparison)). Pass `true` as the second argument to compare strictly, or pass a callback to find the first item that passes a test.

The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#after).

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

#### all

Get the items of the collection: an array for a list, a plain object for a keyed collection.

Laravel: [`all()`](https://laravel.com/docs/collections#method-all)

`all()` hands back the collection's own items, not a copy. See [Values](https://tolki.abe.dev/collections/differences.html#values) in the differences.

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3]).all();
// => [1, 2, 3]

collect({ a: 1, b: 2 }).all();
// => { a: 1, b: 2 }
```

#### average

Alias for the [avg](#avg) method.

Laravel: [`average()`](https://laravel.com/docs/collections#method-average)

```js
import { collect } from "@tolki/collection";

collect([1, 1, 2, 4]).average();
// => 2
```

#### avg

Get the average value of a given key, or of the items themselves when no key is given. Items that are `null` are left out, and an empty collection gives `null`.

Laravel: [`avg()`](https://laravel.com/docs/collections#method-avg)

The callback also receives the key as its second argument (see [JavaScript-only additions](https://tolki.abe.dev/collections/differences.html#javascript-only-additions)). Numeric strings are added as numbers, and a value that cannot be added, such as a non-numeric string or an array, throws a `TypeError`.

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

#### before

Get the item before the given item, or `null` when the item is not found or is the first one. It is the opposite of [after](#after) and takes the same arguments.

Laravel: [`before()`](https://laravel.com/docs/collections#method-before)

The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#before).

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

#### chunk

Break the collection into multiple, smaller collections of a given size.

Laravel: [`chunk()`](https://laravel.com/docs/collections#method-chunk)

Each chunk keeps its items' keys, so a later chunk of a list starts at its original position. Pass `false` as the second argument to renumber each chunk from 0. A size of 0 or below gives an empty collection.

The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#chunk).

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3, 4, 5]).chunk(2).toArray();
// => [{ 0: 1, 1: 2 }, { 2: 3, 3: 4 }, { 4: 5 }]

collect([1, 2, 3, 4, 5]).chunk(2, false).toArray();
// => [[1, 2], [3, 4], [5]]

collect({ a: 1, b: 2, c: 3 }).chunk(2).toArray();
// => [{ a: 1, b: 2 }, { c: 3 }]
```

#### chunkBy

Break the collection into chunks of adjacent items that share the same value for a key or callback.

Laravel: [`chunkBy()`](https://laravel.com/docs/collections#method-chunkby)

Unlike `groupBy`, items with the same value that are not next to each other land in separate chunks. A key may be a [dot-notation](https://tolki.abe.dev/arrays-objects/dot-notation.html) path, and values are compared loosely, so `1` and `"1"` share a chunk (see [Loose and strict comparison](https://tolki.abe.dev/arrays-objects/php-semantics.html#loose-and-strict-comparison)).

<!-- docs/php-parity/Collection/chunkBy.json, "chunkBy with a callback" -->

A list's chunks are lists, so each one counts from 0 again. In Laravel a later chunk keeps the keys its items had (see [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order)).

The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#chunkby).

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

#### chunkWhile

Break the collection into chunks with a callback that decides whether the next item joins the current chunk.

Laravel: [`chunkWhile()`](https://laravel.com/docs/collections#method-chunkwhile)

The callback receives the value, its key and the chunk built so far as a collection, so `chunk.last()` works. Return `true` to keep adding to the chunk.

<!-- docs/php-parity/Collection/chunkWhile.json, "chunkWhile on equal adjacent elements" -->

A list's chunks are lists, so each one counts from 0 again. In Laravel a later chunk keeps the keys its items had (see [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order)).

The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#chunkwhile).

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

#### collapse

Collapse a collection of arrays, objects or collections into a single, flat collection.

Laravel: [`collapse()`](https://laravel.com/docs/collections#method-collapse)

Arrays join into a list, and objects merge into a keyed collection. To keep each item's keys, use [collapseWithKeys](#collapsewithkeys). The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#collapse).

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

#### collapseWithKeys

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

#### collect

Get a new collection holding a copy of the items.

Laravel: [`collect()`](https://laravel.com/docs/collections#method-collect)

This is the `collect` method of a collection. The [`collect()` function](https://tolki.abe.dev/collections/index.html#creating-collections) that builds a collection from an array is a separate helper.

```js
import { collect } from "@tolki/collection";

const original = collect([1, 2, 3]);
const copy = original.collect();

copy.add(4).all();
// => [1, 2, 3, 4]

original.all();
// => [1, 2, 3]
```

#### combine

Combine the values of the collection, as keys, with the values of another array or collection.

Laravel: [`combine()`](https://laravel.com/docs/collections#method-combine)

The collection's own keys are not used. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#combine).

```js
import { collect } from "@tolki/collection";

collect(["name", "age"]).combine(["George", 29]).all();
// => { name: "George", age: 29 }
```

#### concat

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

#### contains

Determine whether the collection contains a given item.

Laravel: [`contains()`](https://laravel.com/docs/collections#method-contains)

Pass a callback to test each item, a value to look for, or a key and a value to look for a matching pair in the items. Comparisons are loose, so `"2"` matches `2` (see [Loose and strict comparison](https://tolki.abe.dev/arrays-objects/php-semantics.html#loose-and-strict-comparison)). Use [containsStrict](#containsstrict) to compare strictly, and [doesntContain](#doesntcontain) for the opposite. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#contains).

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

#### containsManyItems

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

#### containsOneItem

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

#### containsStrict

Determine whether the collection contains a given item, comparing strictly.

Laravel: [`containsStrict()`](https://laravel.com/docs/collections#method-containsstrict)

It takes the same arguments as [contains](#contains), but `"2"` does not match `2`. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#containsstrict).

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

#### count

Get the total number of items in the collection.

Laravel: [`count()`](https://laravel.com/docs/collections#method-count)

The [`length`](#length) property gives the same number. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#count).

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3, 4]).count();
// => 4

collect({ a: 1, b: 2 }).count();
// => 2

collect([]).count();
// => 0
```

#### countBy

Count the occurrences of values in the collection, by the value itself, a key or a callback.

Laravel: [`countBy()`](https://laravel.com/docs/collections#method-countBy)

The result is a keyed collection of counts. An `@tolki/enum` case counts as its value (see [JavaScript-only additions](https://tolki.abe.dev/collections/differences.html#javascript-only-additions)).

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

#### crossJoin

Cross join the collection's values among the given arrays or collections, returning every possible combination.

Laravel: [`crossJoin()`](https://laravel.com/docs/collections#method-crossjoin)

Keys are ignored: each list contributes its values. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#crossjoin).

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

#### diff

Get the values in the collection that are not present in the given array or collection.

Laravel: [`diff()`](https://laravel.com/docs/collections#method-diff)

A keyed collection keeps its keys. Values are compared as strings, so `2` matches `"2"`. Array and object items are matched by identity: see [Differences from Laravel](https://tolki.abe.dev/collections/differences.html#values). The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#diff).

<!-- docs/php-parity/Collection/diff.json, "diff on array-backed collection" -->

A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3, 4, 5]).diff([2, 4, 6, 8]).all();
// => [1, 3, 5]

collect({ a: 1, b: 2, c: 3 }).diff([2]).all();
// => { a: 1, c: 3 }

collect([1, 2, 3]).diff(["2"]).all();
// => [1, 3]
```

#### diffAssoc

Get the key and value pairs in the collection that are not present in the given array or collection.

Laravel: [`diffAssoc()`](https://laravel.com/docs/collections#method-diffassoc)

A pair is left out only when both its key and its value match. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#diffassoc).

<!-- docs/php-parity/Collection/diffAssoc.json, "diffAssoc on array-backed collection" -->

A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

```js
import { collect } from "@tolki/collection";

collect({ color: "orange", type: "fruit", remain: 6 })
  .diffAssoc({ color: "yellow", type: "fruit", remain: 3, used: 6 })
  .all();
// => { color: "orange", remain: 6 }
```

#### diffAssocUsing

Get the key and value pairs that are not present in the given items, comparing keys with a callback of your own.

Laravel: [`diffAssocUsing()`](https://laravel.com/docs/collections#method-diffassocusing)

The callback receives two keys and answers `0`, or `true`, when they match. Values are still compared strictly. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#diffassocusing).

```js
import { collect } from "@tolki/collection";

const ignoreCase = (a, b) =>
  String(a).toLowerCase() === String(b).toLowerCase() ? 0 : 1;

collect({ color: "orange", type: "fruit", remain: 6 })
  .diffAssocUsing({ Color: "yellow", Type: "fruit", Remain: 3 }, ignoreCase)
  .all();
// => { color: "orange", remain: 6 }
```

#### diffKeys

Get the key and value pairs in the collection whose keys are not present in the given array or collection.

Laravel: [`diffKeys()`](https://laravel.com/docs/collections#method-diffkeys)

Values are ignored. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#diffkeys).

```js
import { collect } from "@tolki/collection";

collect({ one: 10, two: 20, three: 30, four: 40, five: 50 })
  .diffKeys({ two: 2, four: 4, six: 6, eight: 8 })
  .all();
// => { one: 10, three: 30, five: 50 }

collect([1, 3, 5, 7, 8]).diffKeys([1, 3, 5]).all();
// => [7, 8]
```

#### diffKeysUsing

Get the key and value pairs whose keys are not present in the given items, comparing keys with a callback of your own.

The callback receives two keys and answers `0`, or `true`, when they match. Values are ignored. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#diffkeysusing).

```js
import { collect } from "@tolki/collection";

const ignoreCase = (a, b) =>
  String(a).toLowerCase() === String(b).toLowerCase() ? 0 : 1;

collect({ id: 1, first_word: "Hello" })
  .diffKeysUsing({ ID: 123, foo_bar: "Hello" }, ignoreCase)
  .all();
// => { first_word: "Hello" }
```

#### diffUsing

Get the values in the collection that are not present in the given items, comparing values with a callback of your own.

The callback receives two values and answers `0`, or `true`, when they match. Keys are kept. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#diffusing).

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

#### doesntContain

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

#### doesntContainStrict

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

#### dot

Flatten a multi-dimensional collection into a single level that uses "dot" notation to show depth.

Laravel: [`dot()`](https://laravel.com/docs/collections#method-dot)

Pass a depth to stop flattening early. The keys follow the rules in [Dot Notation](https://tolki.abe.dev/arrays-objects/dot-notation.html). The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#dot).

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

#### dump

Dump the collection's items to the console, along with any further values you pass, and return the collection.

Laravel: [`dump()`](https://laravel.com/docs/collections#method-dump)

`dump()` logs the items with `console.log`, so the example below logs the two names to the console. Because it returns the collection, you can drop it into the middle of a chain. There is no `dd()`: see [Not portable](https://tolki.abe.dev/collections/differences.html#not-portable).

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

#### duplicates

Get the values that appear more than once, each under the key of its second and later appearances.

Laravel: [`duplicates()`](https://laravel.com/docs/collections#method-duplicates)

<!-- docs/php-parity/Collection/duplicates.json, "C32-D-duplicates-list-first-key" -->

The keys are the positions of the repeated values, as in [chunk](#chunk), because the keys are the answer. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order). Pass a key, or a callback, to check the values it reads from each item; the result holds those values. Values are compared loosely, so `1` and `"1"` are duplicates (see [Loose and strict comparison](https://tolki.abe.dev/arrays-objects/php-semantics.html#loose-and-strict-comparison)). Use [duplicatesStrict](#duplicatesstrict) to compare strictly.

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

#### duplicatesStrict

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

#### each

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

#### eachSpread

Run a callback over each nested row, passing the row's values as separate arguments, and return the collection.

Laravel: [`eachSpread()`](https://laravel.com/docs/collections#method-eachspread)

The row's key arrives after its values. Return `false` from the callback to stop iterating. A plain object or a `Map` row is spread by its values, and a scalar row is passed whole: see [JavaScript-only additions](https://tolki.abe.dev/collections/differences.html#javascript-only-additions).

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

#### empty

The static `empty` method creates a collection with no items.

```js
import { Collection } from "@tolki/collection";

Collection.empty().all();
// => []

Collection.empty().isEmpty();
// => true
```

In TypeScript, name the item type yourself with `Collection.empty<string>()`.

#### ensure

Check that every item has the expected type, and throw when one does not.

Laravel: [`ensure()`](https://laravel.com/docs/collections#method-ensure)

The type is a class, a type name such as `"int"`, `"float"`, `"string"`, `"bool"`, `"array"` or `"null"`, or a list of them. When an item matches none, `ensure()` throws an `UnexpectedValueException` that names the item's type and position. It also takes JavaScript's `typeof` names: see [JavaScript-only additions](https://tolki.abe.dev/collections/differences.html#javascript-only-additions). A class passed as itself accepts its subclasses too, while a class named as a string matches only that class.

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

#### escapeWhenCastingToString

Make the collection HTML-escape its string form, or stop it doing so.

Casting a collection to a string gives its JSON. Once escaping is on, that string has `&`, `<`, `>`, `"` and `'` replaced with HTML entities. The escaping applies to the string cast alone: [`toJson()`](#tojson) is unchanged. Pass `false` to turn escaping off again.

Unlike most other collection methods, `escapeWhenCastingToString` does not return a new modified collection; it modifies and returns the collection it is called on.

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

#### every

Determine whether all items pass a truth test.

Laravel: [`every()`](https://laravel.com/docs/collections#method-every)

Besides a callback, `every()` takes a key and a value, or a key, an operator and a value. An empty collection passes.

The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#every).

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

#### except

Get all items except those with the given keys.

Laravel: [`except()`](https://laravel.com/docs/collections#method-except)

Pass the keys as an array or a collection, or as separate arguments. For the inverse, see [only](#only). The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#except).

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

#### filter

Keep only the items that pass a truth test.

Laravel: [`filter()`](https://laravel.com/docs/collections#method-filter)

The callback receives the item and its key. Without a callback, `filter()` drops every item that is falsy by [PHP's rules](https://tolki.abe.dev/arrays-objects/php-semantics.html#truthiness). For the inverse, see [reject](#reject). The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#filter).

<!-- docs/php-parity/Collection/filter.json, "filter-list-gap-keys" -->

A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

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

#### first

Get the first item, or the first item that passes a truth test.

Laravel: [`first()`](https://laravel.com/docs/collections#method-first)

With no match, `first()` returns `null`. Pass a default, or a callback that returns one, as the second argument. To throw instead, use [firstOrFail](#firstorfail). The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#first).

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

#### firstOrFail

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

#### firstWhere

Get the first item with the given key and value.

Laravel: [`firstWhere()`](https://laravel.com/docs/collections#method-first-where)

It takes the arguments of [where](#where): a key and a value, or a key, an operator and a value. With a key alone, it returns the first item where that key is truthy. When nothing matches, it returns `null`.

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

#### flatMap

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

#### flatten

Flatten a multi-dimensional collection into a single level.

Laravel: [`flatten()`](https://laravel.com/docs/collections#method-flatten)

Pass a depth to flatten only that many levels. A nested collection is flattened too, and any other object that is not a plain object is kept whole. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#flatten).

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

#### flip

Swap the collection's keys with their values.

Laravel: [`flip()`](https://laravel.com/docs/collections#method-flip)

The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#flip).

```js
import { collect } from "@tolki/collection";

collect({ name: "Taylor", framework: "Laravel" }).flip().all();
// => { Taylor: "name", Laravel: "framework" }

collect(["a", "b", "c"]).flip().all();
// => { a: 0, b: 1, c: 2 }
```

#### forget

Remove one or more items by key.

Laravel: [`forget()`](https://laravel.com/docs/collections#method-forget)

Pass one key, an array of keys or a collection of keys. Each key is removed as it is, so a dotted key such as `"a.b"` does not reach a nested value; the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#forget) has the version that reads a path.

<!-- docs/php-parity/Collection/forget.json, "forget-list-gap-keys" -->

A list stays a list, so the items after the removed ones move down. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

Unlike most other collection methods, `forget` does not return a new modified collection; it modifies and returns the collection it is called on.

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

#### forPage

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

#### fromJson

The static `fromJson` method creates a collection by decoding a JSON string.

Laravel: [`fromJson()`](https://laravel.com/docs/collections#method-fromjson)

An object becomes a keyed collection and an array a list. JSON that cannot be decoded gives an empty collection. The `depth` and `flags` arguments are accepted and ignored: see [Not portable](https://tolki.abe.dev/collections/differences.html#not-portable).

```js
import { Collection } from "@tolki/collection";

Collection.fromJson('{"name":"Taylor Otwell","role":"Developer"}').all();
// => { name: "Taylor Otwell", role: "Developer" }

Collection.fromJson("[1,2,3]").all();
// => [1, 2, 3]

Collection.fromJson("{bad").all();
// => []
```

#### get

Get the item at a key, or a default when the key is absent.

Laravel: [`get()`](https://laravel.com/docs/collections#method-get)

The default may be a value or a callback that returns one. The key is looked up as it is, not as a path, so `get("a.b")` does not read a nested value; the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#get) has the version that reads a path.

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

#### getIterator

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

#### getOrPut

Get the item at a key. When the key is absent, put a value under it and return that value.

The value may be a callback, which runs only when the key is absent.

Unlike most other collection methods, `getOrPut` does not return a new modified collection; it modifies the collection it is called on.

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

#### groupBy

Group the items by a key or a callback.

Laravel: [`groupBy()`](https://laravel.com/docs/collections#method-groupby)

Each group is a collection, so use [`toArray()`](#toarray) to read them all at once. Pass a callback to compute the group key. Pass an array of keys and callbacks to group in levels, one per entry.

<!-- docs/php-parity/Collection/groupBy.json, "C32-E-groupBy-preserve-keys-list-backing" -->

Pass `true` as the second argument to keep each item's key inside its group. A list's items then keep their positions, as [chunk](#chunk) does. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

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

#### has

Determine whether a key exists in the collection.

Laravel: [`has()`](https://laravel.com/docs/collections#method-has)

Pass an array of keys, or several arguments, to require them all. Keys are looked up as they are, not as paths, so `has("a.b")` does not look inside `a`; the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#has) has the version that reads a path. A key that holds `null` still exists.

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

#### hasAny

Determine whether any of the given keys exists in the collection.

Laravel: [`hasAny()`](https://laravel.com/docs/collections#method-hasany)

It looks keys up as they are, like [has](#has). The [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#hasany) has the version that reads paths.

```js
import { collect } from "@tolki/collection";

const order = collect({ account_id: 1, product: "Desk", amount: 5 });

order.hasAny(["product", "price"]);
// => true

order.hasAny(["name", "price"]);
// => false
```

#### hasMany

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

#### hasSole

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

#### implode

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

#### intersect

Remove the values that are not in the given array or collection.

Laravel: [`intersect()`](https://laravel.com/docs/collections#method-intersect)

Only the values are compared, as strings, so `2` matches `"2"`. Array and object items are matched by identity: see [Differences from Laravel](https://tolki.abe.dev/collections/differences.html#values). The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#intersect).

<!-- docs/php-parity/Collection/intersect.json, "X12 intersect compares values only" -->

A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

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

#### intersectAssoc

Keep the key and value pairs that are present in the collection and in the given array or collection.

Laravel: [`intersectAssoc()`](https://laravel.com/docs/collections#method-intersectAssoc)

A pair stays only when both its key and its value match. Values are compared as strings, so `1` matches `"1"`. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#intersectassoc).

<!-- docs/php-parity/Collection/intersectAssoc.json, "intersectAssoc-list-keeps-gap-keys" -->

A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

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

#### intersectAssocUsing

Keep the key and value pairs that are present in the collection and in the given items, comparing keys with a callback of your own.

Laravel: [`intersectAssocUsing()`](https://laravel.com/docs/collections#method-intersectassocusing)

The callback receives two keys and answers `0`, or `true`, when they match. Values are compared as strings, so `1` matches `"1"`. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#intersectassocusing).

<!-- docs/php-parity/Collection/intersectAssocUsing.json, "intersectAssocUsing-list-keeps-gap-keys" -->

A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

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

#### intersectByKeys

Keep the items whose keys are present in the given array or collection.

Laravel: [`intersectByKeys()`](https://laravel.com/docs/collections#method-intersectbykeys)

Values are ignored. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#intersectbykeys).

<!-- docs/php-parity/Collection/intersectByKeys.json, "intersectByKeys-list-keeps-gap-keys" -->

A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

```js
import { collect } from "@tolki/collection";

collect({ serial: "UX301", type: "screen", year: 2009 })
  .intersectByKeys({ reference: "UX404", type: "tab", year: 2011 })
  .all();
// => { type: "screen", year: 2009 }
```

#### intersectUsing

Remove the values that are not in the given array or collection, comparing the values with a callback of your own.

Laravel: [`intersectUsing()`](https://laravel.com/docs/collections#method-intersectusing)

The callback receives two values and answers `0`, or `true`, when they match. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#intersectusing).

<!-- docs/php-parity/Collection/intersectUsing.json, "C32-F-intersectUsing-spaceship-comparator" -->

A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

```js
import { collect } from "@tolki/collection";

const ignoreCase = (a, b) => a.toLowerCase().localeCompare(b.toLowerCase());

collect(["Desk", "Sofa", "Chair"])
  .intersectUsing(["desk", "chair", "bookcase"], ignoreCase)
  .all();
// => ["Desk", "Chair"]
```

#### isEmpty

Determine whether the collection has no items.

Laravel: [`isEmpty()`](https://laravel.com/docs/collections#method-isempty)

```js
import { collect } from "@tolki/collection";

collect([]).isEmpty();
// => true

collect([1, 2, 3]).isEmpty();
// => false
```

#### isNotEmpty

Determine whether the collection has at least one item.

Laravel: [`isNotEmpty()`](https://laravel.com/docs/collections#method-isnotempty)

```js
import { collect } from "@tolki/collection";

collect([]).isNotEmpty();
// => false

collect([1, 2, 3]).isNotEmpty();
// => true
```

#### join

Join the items into a string, with a separate glue for the last item if you want one.

Laravel: [`join()`](https://laravel.com/docs/collections#method-join)

The second argument is placed before the last item. With one item, that item is returned as it is. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#join).

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

#### jsonSerialize

Get the items in a form that `JSON.stringify` can encode.

A list, or a collection whose keys run `0..n-1` in order, gives an array. Any other keyed collection gives a record. Nested collections are converted too. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order) for how a keyed collection holds integer keys.

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

#### keyBy

Key the collection by a field of each item, or by what a callback returns.

Laravel: [`keyBy()`](https://laravel.com/docs/collections#method-keyby)

When several items give the same key, only the last one is kept. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#keyby).

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

#### keys

Get the keys of the collection as a new collection.

Laravel: [`keys()`](https://laravel.com/docs/collections#method-keys)

The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#keys).

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

#### last

Get the last item, or the last item that passes a test.

Laravel: [`last()`](https://laravel.com/docs/collections#method-last)

With no match, `last` returns `null`, or the default you pass as the second argument, which may be a callback. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#last).

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

#### length

Get the number of items in the collection, as a property.

It gives the same number as [`count()`](#count), and lets a collection work with APIs that read `length`, such as `Array.from()`.

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3]).length;
// => 3

collect({ a: 1, b: 2 }).length;
// => 2
```

#### make

Create a new collection from the given items.

Laravel: [`make()`](https://laravel.com/docs/collections#method-make)

The static `make` method does the same as [`collect()`](https://tolki.abe.dev/collections/index.html#creating-collections). Called on a subclass, it builds an instance of that subclass.

```js
import { Collection } from "@tolki/collection";

Collection.make([1, 2, 3]).all();
// => [1, 2, 3]

Collection.make({ a: 1, b: 2 }).all();
// => { a: 1, b: 2 }

Collection.make(null).all();
// => []
```

#### map

Run a callback over every item and collect the results in a new collection.

Laravel: [`map()`](https://laravel.com/docs/collections#method-map)

The callback receives the value and the key, and the keys are kept. Like most collection methods, `map` returns a new collection and leaves the original as it was. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#map).

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

#### mapInto

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

#### mapSpread

Run a callback over every nested row, passing the items of the row as separate arguments.

Laravel: [`mapSpread()`](https://laravel.com/docs/collections#method-mapspread)

The key of the row comes after its items. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#mapspread).

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

#### mapToDictionary

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

#### mapToGroups

Run a callback that gives one key and value pair for each item, and gather the values into collections under their keys.

Laravel: [`mapToGroups()`](https://laravel.com/docs/collections#method-maptogroups)

The callback returns an object with a single pair. Each group is a collection, so use [`.toArray()`](#toarray) to read them all at once.

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

#### mapWithKeys

Run a callback that gives one key and value pair for each item, and build a collection from the pairs.

Laravel: [`mapWithKeys()`](https://laravel.com/docs/collections#method-mapwithkeys)

The callback returns an object with a single pair. When two items give the same key, the later one wins. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#mapwithkeys).

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

#### max

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

#### median

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

#### merge

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

#### mergeRecursive

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

#### min

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

#### mode

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

#### multiply

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

#### nth

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

#### offsetExists

Determine whether an item exists at a key.

This is the method behind Laravel's `isset($c['a'])`. An item that is `null` counts as absent. See [Reading items](https://tolki.abe.dev/collections/differences.html#reading-items).

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3]).offsetExists(1);
// => true

collect([1, 2, 3]).offsetExists(3);
// => false

collect({ a: null }).offsetExists("a");
// => false
```

#### offsetGet

Get the item at a key.

This is the method behind Laravel's `$c['a']`; a collection has no `c.a` or `c[0]`. A missing key gives `undefined`, where [`get`](#get) takes a default. See [Reading items](https://tolki.abe.dev/collections/differences.html#reading-items).

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3]).offsetGet(1);
// => 2

collect({ a: 1, b: 2 }).offsetGet("a");
// => 1

collect({ a: 1, b: 2 }).offsetGet("c");
// => undefined
```

#### offsetSet

Set the item at a key, or append it when the key is `null`.

This is the method behind Laravel's `$c['a'] = 1` and `$c[] = 1`. See [Reading items](https://tolki.abe.dev/collections/differences.html#reading-items).

Unlike most other collection methods, `offsetSet` does not return a new modified collection; it modifies the collection it is called on, and returns nothing.

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

#### offsetUnset

Remove the item at a key.

This is the method behind Laravel's `unset($c['a'])`. A key that is not there changes nothing. See [Reading items](https://tolki.abe.dev/collections/differences.html#reading-items).

<!-- docs/php-parity/Collection/offsetUnset.json, "offsetUnset-list-gap-keys" -->

A list stays a list, so the items after the removed one move down a key. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

Unlike most other collection methods, `offsetUnset` does not return a new modified collection; it modifies the collection it is called on, and returns nothing.

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

#### only

Get the items with the given keys.

Laravel: [`only()`](https://laravel.com/docs/collections#method-only)

Pass the keys as an array or a collection, or as separate arguments. Each key is taken as it is, so `"a.b"` does not reach a nested value. A key the collection lacks is skipped, and `null` returns every item. For the inverse, see [except](#except). The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#only).

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

#### pad

Fill the collection with a value until it reaches a size.

Laravel: [`pad()`](https://laravel.com/docs/collections#method-pad)

A positive size pads at the end, and a negative size pads at the beginning. Nothing is added when the size, ignoring its sign, is no more than the number of items. When the collection grows, its integer keys are renumbered from 0 in order, pad slots included, and its string keys are kept. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#pad).

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

#### partition

Separate the items that pass a truth test from those that do not.

Laravel: [`partition()`](https://laravel.com/docs/collections#method-partition)

The result is a collection of two collections: the items that pass, then the rest. Destructure it, or read `[0]` and `[1]`. Pass a callback, a key to test for truthiness, or a key with an operator and a value, as [where](#where) does. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#partition).

<!-- docs/php-parity/Collection/partition.json, "partition-list-keys" -->

A list stays a list, so each half is renumbered from 0. In Laravel each half keeps the keys its items had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

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

#### percentage

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

#### pipe

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

#### pipeInto

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

#### pipeThrough

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

#### pluck

Get the values of a key from every item.

Laravel: [`pluck()`](https://laravel.com/docs/collections#method-pluck)

Pass a second argument to key the result by another field. If several items give the same key, the last one wins. The key can be a path in "dot" notation, with `*` for every element of a list: see [Dot Notation](https://tolki.abe.dev/arrays-objects/dot-notation.html) and [Wildcards](https://tolki.abe.dev/arrays-objects/dot-notation.html#wildcards). Either argument can be a callback that receives the item instead. An item without the key gives `null`. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#pluck).

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

#### pop

Remove and return the last item, or the last several items.

Laravel: [`pop()`](https://laravel.com/docs/collections#method-pop)

Without a count, `pop` returns the last item, or `null` for an empty collection. A count of 1 does the same. A count of 2 or more returns a new collection of that many items from the end, last first, and a count of `0` or below returns an empty collection and removes nothing. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#pop).

Unlike most other collection methods, `pop` does not return a new modified collection; it modifies the collection it is called on, and returns the item or items it removed.

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

#### prepend

Add an item to the beginning of the collection.

Laravel: [`prepend()`](https://laravel.com/docs/collections#method-prepend)

Pass a second argument to give the item a key. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#prepend), where it returns a new value and leaves the original unchanged.

<!-- docs/php-parity/Collection/prepend.json, "order-prepend-with-null-key" -->

A `null` or `undefined` key files the item under the empty string `""`, as it does in Laravel.

Unlike most other collection methods, `prepend` does not return a new modified collection; it modifies and returns the collection it is called on.

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

#### pull

Remove an item by key and return it.

Laravel: [`pull()`](https://laravel.com/docs/collections#method-pull)

The second argument is returned when the key is missing; it may be a callback. A key with dots reaches into nested arrays and objects, and removes the value there. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#pull), where it returns a new value and leaves the original unchanged.

<!-- docs/php-parity/Collection/pull.json, "pull-list-gap-keys" -->

A list stays a list, so the items after the removed one move down a key. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

Unlike most other collection methods, `pull` does not return a new modified collection; it modifies the collection it is called on, and returns the item it removed.

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

#### push

Add one or more items to the end of the collection.

Laravel: [`push()`](https://laravel.com/docs/collections#method-push)

On a keyed collection, each item is stored under the next free integer key. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#push), where it returns a new value and leaves the original unchanged.

Unlike most other collection methods, `push` does not return a new modified collection; it modifies and returns the collection it is called on.

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

#### put

Set the item at a key.

Laravel: [`put()`](https://laravel.com/docs/collections#method-put)

The key is added when it is new and overwritten when it exists. On a list, `put` at the next integer key appends, and any other key makes the collection keyed. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

Unlike most other collection methods, `put` does not return a new modified collection; it modifies and returns the collection it is called on.

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

#### random

Get one random item, or several.

Laravel: [`random()`](https://laravel.com/docs/collections#method-random)

Without an argument, `random` returns one item. With a count, it returns a collection of that many items, and it throws an `InvalidArgumentException` when the collection has fewer. The count can be a callback that receives the collection and returns the count. The picked items come back as a list; pass `true` as the second argument to keep their keys, which [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order) explains. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#random).

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

#### range

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

#### reduce

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

#### reduceInto

Reduce the collection into a starting value by changing that value.

Laravel: [`reduceInto()`](https://laravel.com/docs/collections#method-reduce-into)

Unlike [reduce](#reduce), the callback need not return the result. It receives the starting value, the item and its key, and changes the starting value in place. `reduceInto` returns the starting value.

JavaScript cannot change a number or a string in place, so the callback may return the new value instead. Returning nothing keeps the current one. See [JavaScript-only additions](https://tolki.abe.dev/collections/differences.html#javascript-only-additions).

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

#### reduceSpread

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

#### reduceWithKeys

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

#### reject

Remove the items that pass a truth test.

Laravel: [`reject()`](https://laravel.com/docs/collections#method-reject)

The callback receives the item and its key, and the items it answers truthy for are removed. Pass a value instead to remove each item equal to it, compared loosely (see [Loose and strict comparison](https://tolki.abe.dev/arrays-objects/php-semantics.html#loose-and-strict-comparison)). With no argument, `reject` removes every item that is truthy by [PHP's rules](https://tolki.abe.dev/arrays-objects/php-semantics.html#truthiness). For the inverse, see [filter](#filter). The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#reject).

<!-- docs/php-parity/Collection/reject.json, "reject-list-gap-keys" -->

A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

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

#### replace

Replace items by key.

Laravel: [`replace()`](https://laravel.com/docs/collections#method-replace)

`replace` works like [merge](#merge), but it also overwrites items with matching integer keys. It returns a new collection, and a key the original lacks is added. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#replace).

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

#### replaceRecursive

Replace items by key, going into nested arrays and objects.

Laravel: [`replaceRecursive()`](https://laravel.com/docs/collections#method-replacerecursive)

`replaceRecursive` works like [replace](#replace), but it goes into nested arrays and objects and applies the same replacement to the inner values. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#replacerecursive).

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

#### reverse

Reverse the order of the items.

Laravel: [`reverse()`](https://laravel.com/docs/collections#method-reverse)

It returns a new collection. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#reverse).

<!-- docs/php-parity/Collection/reverse.json, "reverse over the same fixture" -->

Integer keys are renumbered from 0 in the new order and string keys are kept, where Laravel keeps every key. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

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

#### search

Find the key of the first item that matches a value.

Laravel: [`search()`](https://laravel.com/docs/collections#method-search)

It returns the key of the match, or `false` when nothing matches. The search is loose by default, so `"4"` finds `4` (see [Loose and strict comparison](https://tolki.abe.dev/arrays-objects/php-semantics.html#loose-and-strict-comparison)). Pass `true` as the second argument to compare strictly, or pass a callback to find the first item that passes a test. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#search).

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

#### select

Keep only the given keys of each item.

Laravel: [`select()`](https://laravel.com/docs/collections#method-select)

It works like an SQL `SELECT`: where [only](#only) picks items by their key in the collection, `select` picks keys inside every item. Pass the keys as an array or a collection, or as separate arguments. A key an item lacks is skipped. The keys are exact, not paths, so `"details.age"` does not reach into `details`, and Laravel does the same. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#select).

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

#### shift

Remove and return the first item, or the first several items.

Laravel: [`shift()`](https://laravel.com/docs/collections#method-shift)

Without a count, `shift` returns the first item, or `null` for an empty collection. A count of 1 does the same. A count of 2 or more returns a new collection of that many items from the start, and a count of `0` returns an empty collection and removes nothing. A negative count throws an `InvalidArgumentException`. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#shift).

Unlike most other collection methods, `shift` does not return a new modified collection; it modifies the collection it is called on, and returns the item or items it removed.

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

#### shuffle

Put the items in a random order.

Laravel: [`shuffle()`](https://laravel.com/docs/collections#method-shuffle)

It returns a new collection and leaves the original as it was. The result is a list, whatever keys the items had. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#shuffle).

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

#### skip

Remove the given number of items from the beginning.

Laravel: [`skip()`](https://laravel.com/docs/collections#method-skip)

It returns a new collection. A count above the number of items gives an empty collection.

<!-- docs/php-parity/Collection/skip.json, "skip-list-keys" -->

A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

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

#### skipUntil

Skip items until one passes a test or equals a value.

Laravel: [`skipUntil()`](https://laravel.com/docs/collections#method-skipuntil)

Pass a callback, which receives the item and its key, or a value. A value is compared strictly, so `"3"` does not match `3`. The item that stops the skipping and every item after it are returned. If nothing stops it, the result is an empty collection. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#skipuntil).

<!-- docs/php-parity/Collection/skipUntil.json, "C32-D-skipUntil-list-keys" -->

A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

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

#### skipWhile

Skip items while a test passes or a value matches.

Laravel: [`skipWhile()`](https://laravel.com/docs/collections#method-skipwhile)

Pass a callback, which receives the item and its key, or a value. A value is compared strictly, so `"1"` does not match `1`. The first item that fails the test and every item after it are returned. If the test never fails, the result is an empty collection. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#skipwhile).

<!-- docs/php-parity/Collection/skipWhile.json, "C32-D-skipWhile-list-keys" -->

A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

```js
import { collect } from "@tolki/collection";

const numbers = collect([1, 2, 3, 4]);

numbers.skipWhile((item) => item <= 3).all();
// => [4]

collect([1, 1, 2, 1]).skipWhile(1).all();
// => [2, 1]

collect([1, 1, 2]).skipWhile("1").all();
// => [1, 1, 2]

numbers.skipWhile(() => true).all();
// => []

collect({ a: 1, b: 2, c: 3 })
  .skipWhile((value, key) => key === "a")
  .all();
// => { b: 2, c: 3 }
```

#### slice

Get a slice of the collection, starting at the given offset.

Laravel: [`slice()`](https://laravel.com/docs/collections#method-slice)

Pass a length as the second argument to limit the size of the slice. A negative offset counts from the end. A negative length stops that many items before the end. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#slice).

<!-- docs/php-parity/Collection/slice.json, "X15 slice with a negative offset and a length" -->

A list stays a list, so the slice is renumbered from 0. In Laravel the items keep the keys they had, which is why its docs call [values](#values) after slicing. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

```js
import { collect } from "@tolki/collection";

const numbers = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

numbers.slice(4).all();
// => [5, 6, 7, 8, 9, 10]

numbers.slice(4, 2).all();
// => [5, 6]

numbers.slice(-2).all();
// => [9, 10]

numbers.slice(2, -5).all();
// => [3, 4, 5]

collect({ a: 1, b: 2, c: 3 }).slice(1).all();
// => { b: 2, c: 3 }
```

#### sliding

Create chunks representing a "sliding window" view of the items.

Laravel: [`sliding()`](https://laravel.com/docs/collections#method-sliding)

Each window holds `size` items (2 by default), and each starts `step` items (1 by default) after the one before. A size or step below 1 throws an `InvalidArgumentException`. If the collection holds fewer items than one window, the result is empty. The windows of a keyed collection keep its keys. It pairs well with [eachSpread](#eachspread) and [mapSpread](#mapspread), which hand each window to a callback as separate arguments.

<!-- docs/php-parity/Collection/sliding.json, "sliding-list-keeps-window-keys" -->

A list stays a list, so each window is renumbered from 0. In Laravel a window keeps the keys its items had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3, 4, 5]).sliding(2).toArray();
// => [[1, 2], [2, 3], [3, 4], [4, 5]]

collect([1, 2, 3, 4, 5]).sliding(3, 2).toArray();
// => [[1, 2, 3], [3, 4, 5]]

collect({ a: 1, b: 2, c: 3 }).sliding().toArray();
// => [{ a: 1, b: 2 }, { b: 2, c: 3 }]

collect([1, 2, 4, 7, 11])
  .sliding()
  .mapSpread((previous, current) => current - previous)
  .all();
// => [1, 2, 3, 4]

collect([1, 2, 3]).sliding(5).toArray();
// => []

collect([1, 2, 3]).sliding(0);
// => throws InvalidArgumentException
```

#### sole

Get the first item that passes a test, but only if exactly one item does.

Laravel: [`sole()`](https://laravel.com/docs/collections#method-sole)

Pass a callback, or a key and a value to look for a matching pair (an operator may sit between them, as in `sole("price", ">", 150)`). With no argument it returns the only item in the collection. It throws an `ItemNotFoundException` when no item matches and a `MultipleItemsFoundException` when several do. To check without throwing, use [hasSole](#hassole).

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3, 4]).sole((value, key) => value === 2);
// => 2

collect([
  { product: "Desk", price: 200 },
  { product: "Chair", price: 100 },
]).sole("product", "Chair");
// => { product: "Chair", price: 100 }

collect([{ product: "Desk", price: 200 }]).sole();
// => { product: "Desk", price: 200 }

collect([1, 2]).sole((value) => value > 5);
// => throws ItemNotFoundException

collect([1, 2]).sole();
// => throws MultipleItemsFoundException
```

#### some

Alias for the [contains](#contains) method.

Laravel: [`some()`](https://laravel.com/docs/collections#method-some)

The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#some).

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3]).some(2);
// => true

collect([1, 2, 3]).some((value) => value > 5);
// => false

collect([1, 2, 3]).some("2");
// => true
```

#### sort

Sort the collection, smallest first.

Laravel: [`sort()`](https://laravel.com/docs/collections#method-sort)

It returns a new collection and leaves the original as it was. To use your own order, pass a callback that takes two items and returns a number below, equal to or above zero. To sort rows by a field, use [sortBy](#sortby), and to sort in the opposite order, use [sortDesc](#sortdesc). The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#sort).

<!-- docs/php-parity/Collection/sort.json, "sort/sortDesc/reverse preserve integer keys and their order" -->

Integer keys are renumbered from 0 in the new order and string keys are kept, where Laravel keeps every key. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

```js
import { collect } from "@tolki/collection";

const numbers = collect([5, 3, 1, 2, 4]);

numbers.sort().all();
// => [1, 2, 3, 4, 5]

numbers.sort((a, b) => b - a).all();
// => [5, 4, 3, 2, 1]

numbers.all();
// => [5, 3, 1, 2, 4]

collect({ a: 3, b: 1, c: 2 }).sort().all();
// => { b: 1, c: 2, a: 3 }
```

#### sortBy

Sort the collection by a key, by the result of a callback, or by several keys.

Laravel: [`sortBy()`](https://laravel.com/docs/collections#method-sortby)

A key may be a [dot-notation](https://tolki.abe.dev/arrays-objects/dot-notation.html) path. Pass `true` as the second argument to sort in descending order. To sort by several fields, pass a list of `[key, direction]` pairs, where the direction is `"asc"` or `"desc"`, or a list of callbacks that compare two items. PHP's sort flags are not supported (see [Not portable](https://tolki.abe.dev/collections/differences.html#not-portable)).

<!-- docs/php-parity/Collection/sortBy.json, "sortBy-keeps-every-key" -->

Integer keys are renumbered from 0 in the new order and string keys are kept, where Laravel keeps every key. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

```js
import { collect } from "@tolki/collection";

const products = collect([
  { name: "Desk", price: 200 },
  { name: "Chair", price: 100 },
  { name: "Bookcase", price: 150 },
]);

products.sortBy("price").all();
// => [
//   { name: "Chair", price: 100 },
//   { name: "Bookcase", price: 150 },
//   { name: "Desk", price: 200 },
// ]

products.sortBy("price", true).all();
// => [
//   { name: "Desk", price: 200 },
//   { name: "Bookcase", price: 150 },
//   { name: "Chair", price: 100 },
// ]

products
  .sortBy((product) => product.name.length)
  .pluck("name")
  .all();
// => ["Desk", "Chair", "Bookcase"]

const people = collect([
  { name: "Taylor Otwell", age: 34 },
  { name: "Abigail Otwell", age: 30 },
  { name: "Taylor Otwell", age: 36 },
  { name: "Abigail Otwell", age: 32 },
]);

people
  .sortBy([
    ["name", "asc"],
    ["age", "desc"],
  ])
  .pluck("age")
  .all();
// => [32, 30, 36, 34]

people
  .sortBy([(a, b) => a.name.localeCompare(b.name), (a, b) => b.age - a.age])
  .pluck("age")
  .all();
// => [32, 30, 36, 34]
```

#### sortByDesc

Sort the collection by a key or callback, largest first.

Laravel: [`sortByDesc()`](https://laravel.com/docs/collections#method-sortbydesc)

It takes the same first argument as [sortBy](#sortby) and sorts in the opposite order. When that argument is a list of `[key, direction]` pairs or callbacks, each one sorts descending.

<!-- docs/php-parity/Collection/sortByDesc.json, "sortByDesc-keeps-every-key" -->

Integer keys are renumbered from 0 in the new order and string keys are kept, where Laravel keeps every key. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

```js
import { collect } from "@tolki/collection";

const products = collect([
  { name: "Desk", price: 200 },
  { name: "Chair", price: 100 },
  { name: "Bookcase", price: 150 },
]);

products.sortByDesc("price").pluck("name").all();
// => ["Desk", "Bookcase", "Chair"]

products
  .sortByDesc((product) => product.name.length)
  .pluck("name")
  .all();
// => ["Bookcase", "Chair", "Desk"]
```

#### sortDesc

Sort the collection, largest first.

Laravel: [`sortDesc()`](https://laravel.com/docs/collections#method-sortdesc)

It is the opposite of [sort](#sort). Unlike `sort`, it takes no callback. To use your own order, call `sort` and invert the comparison. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#sortdesc).

<!-- docs/php-parity/Collection/sort.json, "sort/sortDesc/reverse preserve integer keys and their order" -->

Integer keys are renumbered from 0 in the new order and string keys are kept, where Laravel keeps every key. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

```js
import { collect } from "@tolki/collection";

collect([5, 3, 1, 2, 4]).sortDesc().all();
// => [5, 4, 3, 2, 1]

collect({ a: 1, b: 3, c: 2 }).sortDesc().all();
// => { b: 3, c: 2, a: 1 }
```

#### sortKeys

Sort the collection by its keys.

Laravel: [`sortKeys()`](https://laravel.com/docs/collections#method-sortkeys)

Pass `true` to sort in descending order. See [sortKeysDesc](#sortkeysdesc) and [sortKeysUsing](#sortkeysusing).

<!-- docs/php-parity/Collection/sortKeys.json, "sortKeys-keeps-every-key" -->

Integer keys are renumbered from 0 in the new order and string keys are kept, where Laravel keeps every key. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

```js
import { collect } from "@tolki/collection";

collect({ id: 22345, first: "John", last: "Doe" }).sortKeys().all();
// => { first: "John", id: 22345, last: "Doe" }

collect({ id: 22345, first: "John", last: "Doe" }).sortKeys(true).all();
// => { last: "Doe", id: 22345, first: "John" }

collect({ 5: "e", 2: "b", 9: "z" }).sortKeys().all();
// => { 0: "b", 1: "e", 2: "z" }
```

#### sortKeysDesc

Sort the collection by its keys, largest first.

Laravel: [`sortKeysDesc()`](https://laravel.com/docs/collections#method-sortkeysdesc)

It has the same signature as [sortKeys](#sortkeys) and sorts in the opposite order.

<!-- docs/php-parity/Collection/sortKeysDesc.json, "sortKeysDesc-keeps-every-key" -->

Integer keys are renumbered from 0 in the new order and string keys are kept, where Laravel keeps every key. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

```js
import { collect } from "@tolki/collection";

collect({ id: 22345, first: "John", last: "Doe" }).sortKeysDesc().all();
// => { last: "Doe", id: 22345, first: "John" }

collect({ 5: "e", 2: "b", 9: "z" }).sortKeysDesc().all();
// => { 0: "z", 1: "e", 2: "b" }
```

#### sortKeysUsing

Sort the collection by its keys, using a callback.

Laravel: [`sortKeysUsing()`](https://laravel.com/docs/collections#method-sortkeysusing)

The callback takes two keys and returns a number below, equal to or above zero.

<!-- docs/php-parity/Collection/sortKeysUsing.json, "sortKeysUsing-keeps-every-key" -->

Integer keys are renumbered from 0 in the new order and string keys are kept, where Laravel keeps every key. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

```js
import { collect } from "@tolki/collection";

collect({ ID: 22345, first: "John", last: "Doe" })
  .sortKeysUsing((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
  .all();
// => { first: "John", ID: 22345, last: "Doe" }

collect({ b: 2, a: 1, c: 3 })
  .sortKeysUsing((a, b) => b.localeCompare(a))
  .all();
// => { c: 3, b: 2, a: 1 }
```

#### splice

Remove a slice of the items and return it, optionally putting new items in its place.

Laravel: [`splice()`](https://laravel.com/docs/collections#method-splice)

The first argument is the index to start at, and a negative one counts from the end. The second limits how many items are removed, and without it everything from the index on goes. A third argument holds the items to insert in place of the removed ones, and a single value that is not a list becomes one item. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#splice).

Unlike most other collection methods, `splice` does not return a new modified collection; it modifies the collection it is called on, and returns a new collection of the items it removed.

```js
import { collect } from "@tolki/collection";

const items = collect([1, 2, 3, 4, 5]);

items.splice(2).all();
// => [3, 4, 5]

items.all();
// => [1, 2]

const more = collect([1, 2, 3, 4, 5]);

more.splice(2, 1).all();
// => [3]

more.all();
// => [1, 2, 4, 5]

const inserted = collect([1, 2, 3, 4, 5]);

inserted.splice(2, 1, [10, 11]).all();
// => [3]

inserted.all();
// => [1, 2, 10, 11, 4, 5]

const last = collect([1, 2, 3, 4, 5]);

last.splice(-2).all();
// => [4, 5]

last.all();
// => [1, 2, 3]
```

#### split

Break the collection into the given number of groups.

Laravel: [`split()`](https://laravel.com/docs/collections#method-split)

The groups are as even as possible, and the first ones take the extra items: seven items in three groups make groups of 3, 2 and 2. Each group is a collection, so use `toArray()` to read them all at once. With more groups than items, each item gets a group of its own. A number below 1 throws an `InvalidArgumentException`. To fill each group before starting the next, use [splitIn](#splitin).

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3, 4, 5]).split(3).toArray();
// => [[1, 2], [3, 4], [5]]

collect([1, 2, 3]).split(5).toArray();
// => [[1], [2], [3]]

collect({ a: 1, b: 2, c: 3 }).split(2).toArray();
// => [{ a: 1, b: 2 }, { c: 3 }]

collect([1, 2, 3, 4, 5, 6, 7]).split(3).toArray();
// => [[1, 2, 3], [4, 5], [6, 7]]

collect([1]).split(0);
// => throws InvalidArgumentException
```

#### splitIn

Break the collection into the given number of groups, filling each group before starting the next.

Laravel: [`splitIn()`](https://laravel.com/docs/collections#method-splitin)

Every group but the last is full, and the last gets what is left. A number below 1 throws an `InvalidArgumentException`. Like [chunk](#chunk), each group keeps its items' keys, so a later group of a list starts at its original position. Laravel's docs leave those keys out. Use [values](#values) on each group to renumber it.

<!-- docs/php-parity/Collection/splitIn.json, "C32-G-splitIn-keeps-keys" -->

```js
import { collect } from "@tolki/collection";

const numbers = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

numbers.splitIn(3).toArray();
// => [
//   { 0: 1, 1: 2, 2: 3, 3: 4 },
//   { 4: 5, 5: 6, 6: 7, 7: 8 },
//   { 8: 9, 9: 10 },
// ]

numbers
  .splitIn(3)
  .map((group) => group.values().all())
  .all();
// => [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10]]

collect([1]).splitIn(0);
// => throws InvalidArgumentException
```

#### sum

Get the sum of the items, or of the values a key or callback picks from them.

Laravel: [`sum()`](https://laravel.com/docs/collections#method-sum)

Pass a key, which may be a [dot-notation](https://tolki.abe.dev/arrays-objects/dot-notation.html) path, or a callback to choose the value to add from each item. An empty collection gives `0`. Numeric strings are added as numbers, `null` counts as 0 and `true` as 1. A value that cannot be added, such as a non-numeric string or an array, throws a `TypeError`.

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3, 4, 5]).sum();
// => 15

collect([
  { name: "JavaScript: The Good Parts", pages: 176 },
  { name: "JavaScript: The Definitive Guide", pages: 1096 },
]).sum("pages");
// => 1272

collect([
  { name: "Chair", colors: ["Black"] },
  { name: "Desk", colors: ["Black", "Mahogany"] },
  { name: "Bookcase", colors: ["Red", "Beige", "Brown"] },
]).sum((product) => product.colors.length);
// => 6

collect(["1", "2.5", 3]).sum();
// => 6.5

collect([]).sum();
// => 0

collect(["a", 1]).sum();
// => throws TypeError
```

#### Symbol.iterator

Make the collection iterable, so `for...of`, spreading and `Array.from()` read its values.

It gives the iterator that [getIterator](#getiterator) returns, so the values come in the collection's order and the keys are left out. See [JavaScript-only additions](https://tolki.abe.dev/collections/differences.html#javascript-only-additions).

```js
import { collect } from "@tolki/collection";

[...collect([1, 2])];
// => [1, 2]

[...collect({ a: 1, b: 2 })];
// => [1, 2]

Array.from(collect({ a: 1, b: 2 }));
// => [1, 2]

const seen = [];

for (const value of collect(["x", "y"])) {
  seen.push(value);
}

seen;
// => ["x", "y"]
```

#### Symbol.toPrimitive

Convert the collection to a primitive: its count where a number is wanted, and its JSON string everywhere else.

`+collection` and `Number(collection)` give the number of items. A template string, `String(collection)` and `collection + ""` give what [toString](#tostring) returns. See [JavaScript-only additions](https://tolki.abe.dev/collections/differences.html#javascript-only-additions).

```js
import { collect } from "@tolki/collection";

const numbers = collect([1, 2, 3]);

+numbers;
// => 3

Number(numbers);
// => 3

`${numbers}`;
// => "[1,2,3]"

collect({ a: 1 }) + "";
// => '{"a":1}'
```

#### take

Take the first or last given number of items.

Laravel: [`take()`](https://laravel.com/docs/collections#method-take)

A positive number takes items from the start. A negative number takes that many from the end. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#take).

<!-- docs/php-parity/Collection/take.json, "collection-take-negative-keeps-keys" -->

A list stays a list, so the items taken from the end are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

```js
import { collect } from "@tolki/collection";

const numbers = collect([0, 1, 2, 3, 4, 5]);

numbers.take(3).all();
// => [0, 1, 2]

numbers.take(-2).all();
// => [4, 5]

collect({ a: 1, b: 2, c: 3 }).take(-2).all();
// => { b: 2, c: 3 }
```

#### takeUntil

Take items until one passes a test or equals a value.

Laravel: [`takeUntil()`](https://laravel.com/docs/collections#method-takeuntil)

Pass a callback, which receives the item and its key, or a value. A value is compared strictly, so `"3"` does not match `3`. The items before the one that stops it are returned. If nothing stops it, all the items are returned. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#takeuntil).

```js
import { collect } from "@tolki/collection";

const numbers = collect([1, 2, 3, 4]);

numbers.takeUntil((item) => item >= 3).all();
// => [1, 2]

numbers.takeUntil(3).all();
// => [1, 2]

numbers.takeUntil("3").all();
// => [1, 2, 3, 4]

numbers.takeUntil(9).all();
// => [1, 2, 3, 4]

collect({ a: 1, b: 2, c: 3 })
  .takeUntil((value, key) => key === "c")
  .all();
// => { a: 1, b: 2 }
```

#### takeWhile

Take items while a test passes or a value matches.

Laravel: [`takeWhile()`](https://laravel.com/docs/collections#method-takewhile)

Pass a callback, which receives the item and its key, or a value. A value is compared strictly, so `"1"` does not match `1`. The items before the first one that fails are returned. If the test never fails, all the items are returned. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#takewhile).

```js
import { collect } from "@tolki/collection";

const numbers = collect([1, 2, 3, 4]);

numbers.takeWhile((item) => item < 3).all();
// => [1, 2]

collect([1, 1, 2, 2, 3, 3]).takeWhile(1).all();
// => [1, 1]

collect([1, 1, 2]).takeWhile("1").all();
// => []

numbers.takeWhile(() => true).all();
// => [1, 2, 3, 4]

collect({ a: 1, b: 2, c: 3 })
  .takeWhile((value, key) => key !== "c")
  .all();
// => { a: 1, b: 2 }
```

#### tap

Pass the collection to a callback, then return the collection itself.

Laravel: [`tap()`](https://laravel.com/docs/collections#method-tap)

Use it to look at the collection in the middle of a chain without changing the chain. What the callback returns is ignored. To use the callback's result instead, use [pipe](#pipe).

```js
import { collect } from "@tolki/collection";

const seen = [];

collect([2, 4, 3, 1, 5])
  .sort()
  .tap((collection) => {
    seen.push(collection.values().all());
  })
  .shift();
// => 1

seen;
// => [[1, 2, 3, 4, 5]]

const numbers = collect([1, 2]);

numbers.tap(() => [9]) === numbers;
// => true
```

#### times

Create a collection by calling a callback a given number of times.

Laravel: [`times()`](https://laravel.com/docs/collections#method-times)

The static `times` method calls the callback with the numbers 1 up to the count, and collects what it returns. Without a callback it collects the numbers themselves. A count below 1 gives an empty collection.

```js
import { Collection } from "@tolki/collection";

Collection.times(10, (number) => number * 9).all();
// => [9, 18, 27, 36, 45, 54, 63, 72, 81, 90]

Collection.times(3).all();
// => [1, 2, 3]

Collection.times(0).all();
// => []
```

#### toArray

Get the items as a plain array, or as a plain object for a keyed collection.

Laravel: [`toArray()`](https://laravel.com/docs/collections#method-toarray)

It returns a copy. An item that is itself a collection, or any other object with its own `toArray()` method, is converted too, while a plain object is left as it is. To get the items as they are, with nested collections intact, use [all](#all).

```js
import { collect, Collection } from "@tolki/collection";

collect({ name: "Desk", price: 200 }).toArray();
// => { name: "Desk", price: 200 }

collect([collect([1, 2]), collect({ a: 1 })]).toArray();
// => [[1, 2], { a: 1 }]

collect([collect([1, 2])]).all()[0] instanceof Collection;
// => true
```

#### toBase

Get a plain `Collection` that holds a copy of the items.

Called on an instance of a subclass, it gives back the base class, so the subclass's own methods and behaviour are left behind. Changing the copy leaves the original as it was.

```js
import { Collection } from "@tolki/collection";

class Users extends Collection {}

const users = Users.make([1, 2]);

users instanceof Users;
// => true

users.toBase() instanceof Users;
// => false

const base = users.toBase();

base.push(3);

base.all();
// => [1, 2, 3]

users.all();
// => [1, 2]
```

#### toJson

Get the items as a JSON string.

Laravel: [`toJson()`](https://laravel.com/docs/collections#method-tojson)

It takes the arguments of `JSON.stringify()` in place of PHP's flags: a replacer, which is a function or a list of keys, and a number or string to indent with (see [JavaScript-only additions](https://tolki.abe.dev/collections/differences.html#javascript-only-additions)). It writes `/` and non-ASCII characters as they are (see [Values](https://tolki.abe.dev/collections/differences.html#values)). For a pretty-printed string, use [toPrettyJson](#toprettyjson). To give `JSON.stringify()` the items yourself, see [toJSON](#tojson-1).

```js
import { collect } from "@tolki/collection";

collect({ name: "Desk", price: 200 }).toJson();
// => '{"name":"Desk","price":200}'

collect([1, 2, 3]).toJson();
// => "[1,2,3]"

collect({ a: 1, b: 2 }).toJson(["a"]);
// => '{"a":1}'

collect({ a: 1 }).toJson(null, 2);
// => '{\n  "a": 1\n}'
```

#### toJSON

Give `JSON.stringify()` the items to encode.

`JSON.stringify()` calls this method on any object that has one, so a collection nested in other data is encoded as its items. It returns what [jsonSerialize](#jsonserialize) returns, and [toJson](#tojson) is the method to call yourself when you want the string. See [JavaScript-only additions](https://tolki.abe.dev/collections/differences.html#javascript-only-additions).

```js
import { collect } from "@tolki/collection";

JSON.stringify(collect([1, 2]));
// => "[1,2]"

JSON.stringify({ users: collect([{ id: 1 }]) });
// => '{"users":[{"id":1}]}'

collect({ a: 1 }).toJSON();
// => { a: 1 }
```

#### toPrettyJson

Get the items as a JSON string with line breaks and indentation.

Laravel: [`toPrettyJson()`](https://laravel.com/docs/collections#method-to-pretty-json)

It indents with 4 spaces by default. Like [toJson](#tojson), it takes a replacer and, in place of PHP's flags, the indent to use.

```js
import { collect } from "@tolki/collection";

collect({ name: "Desk", price: 200 }).toPrettyJson();
// => '{\n    "name": "Desk",\n    "price": 200\n}'

collect({ name: "Desk", price: 200 }).toPrettyJson(null, 2);
// => '{\n  "name": "Desk",\n  "price": 200\n}'
```

#### toString

Get the items as a JSON string, which is what casting the collection to a string gives.

It returns the same string as [toJson](#tojson) with no arguments. After [escapeWhenCastingToString](#escapewhencastingtostring), the string is HTML-escaped. [Symbol.toPrimitive](#symboltoprimitive) uses it for string casts.

```js
import { collect } from "@tolki/collection";

collect([1, 2, 3]).toString();
// => "[1,2,3]"

String(collect({ a: 1 }));
// => '{"a":1}'

collect(["<b>"]).escapeWhenCastingToString().toString();
// => '[&quot;&lt;b&gt;&quot;]'
```

#### transform

Replace each item with the value the callback returns for it.

Laravel: [`transform()`](https://laravel.com/docs/collections#method-transform)

The callback receives the item and its key. To get a new collection and leave this one alone, use [map](#map).

Unlike most other collection methods, `transform` does not return a new modified collection; it modifies and returns the collection it is called on.

```js
import { collect } from "@tolki/collection";

const items = collect([1, 2, 3, 4, 5]);

items.transform((item, key) => item * 2).all();
// => [2, 4, 6, 8, 10]

items.all();
// => [2, 4, 6, 8, 10]

items.transform((item) => item + 1) === items;
// => true

collect({ a: 1, b: 2 })
  .transform((value, key) => value + key)
  .all();
// => { a: "1a", b: "2b" }
```

#### undot

Expand a collection with "dot" notation keys into a multi-dimensional one.

Laravel: [`undot()`](https://laravel.com/docs/collections#method-undot)

A key with no dot stays as it is, so a list comes back unchanged. For the reverse, see [dot](#dot). The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#undot).

```js
import { collect } from "@tolki/collection";

collect({
  "name.first_name": "Marie",
  "name.last_name": "Valentine",
  "address.line_1": "2992 Eagle Drive",
  "address.suburb": "Detroit",
})
  .undot()
  .toArray();
// => {
//   name: { first_name: "Marie", last_name: "Valentine" },
//   address: { line_1: "2992 Eagle Drive", suburb: "Detroit" },
// }

collect([1, 2]).undot().all();
// => [1, 2]
```

#### union

Add the given items to the collection, keeping the collection's own value for any key it already has.

Laravel: [`union()`](https://laravel.com/docs/collections#method-union)

The given items only fill keys the collection lacks. The collection is not changed: you get a new one. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#union).

```js
import { collect } from "@tolki/collection";

collect({ 1: ["a"], 2: ["b"] })
  .union({ 3: ["c"], 1: ["d"] })
  .all();
// => { 1: ["a"], 2: ["b"], 3: ["c"] }

collect([1, 2]).union([3, 4, 5]).all();
// => [1, 2, 5]
```

#### unique

Get the items that are not repeated, keeping the first of each.

Laravel: [`unique()`](https://laravel.com/docs/collections#method-unique)

Pass a key or a path to compare items by that value, or a callback that returns the value to compare. Values are compared loosely, so `1` and `"1"` count as the same: see [Loose and strict comparison](https://tolki.abe.dev/arrays-objects/php-semantics.html#loose-and-strict-comparison), and [Values](https://tolki.abe.dev/collections/differences.html#values) for the edge cases. To compare strictly, use [uniqueStrict](#uniquestrict).

<!-- docs/php-parity/Collection/unique.json, "C32-D-unique-loose-bool-mix" -->

A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

```js
import { collect } from "@tolki/collection";

collect([1, 1, 2, 2, 3, 4, 2]).unique().all();
// => [1, 2, 3, 4]

collect([1, "1", 2]).unique().all();
// => [1, 2]

const products = collect([
  { name: "iPhone 6", brand: "Apple", type: "phone" },
  { name: "iPhone 5", brand: "Apple", type: "phone" },
  { name: "Apple Watch", brand: "Apple", type: "watch" },
  { name: "Galaxy S6", brand: "Samsung", type: "phone" },
  { name: "Galaxy Gear", brand: "Samsung", type: "watch" },
]);

products.unique("brand").pluck("name").all();
// => ["iPhone 6", "Galaxy S6"]

products
  .unique((item) => item.brand + item.type)
  .pluck("name")
  .all();
// => ["iPhone 6", "Apple Watch", "Galaxy S6", "Galaxy Gear"]

collect({ a: 1, b: 1, c: 2 }).unique().all();
// => { a: 1, c: 2 }
```

#### uniqueStrict

Get the items that are not repeated, comparing values strictly.

Laravel: [`uniqueStrict()`](https://laravel.com/docs/collections#method-uniquestrict)

It takes the same arguments as [unique](#unique), but `1` and `"1"` are different values: see [Loose and strict comparison](https://tolki.abe.dev/arrays-objects/php-semantics.html#loose-and-strict-comparison).

<!-- docs/php-parity/Collection/uniqueStrict.json, "uniqueStrict-list-gap-keys" -->

A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

```js
import { collect } from "@tolki/collection";

collect([1, "1", 1, 2]).uniqueStrict().all();
// => [1, "1", 2]

collect([{ id: 1 }, { id: "1" }, { id: 1 }])
  .uniqueStrict("id")
  .all();
// => [{ id: 1 }, { id: "1" }]
```

#### unless

Run the callback unless the given value is truthy.

Laravel: [`unless()`](https://laravel.com/docs/collections#method-unless)

The callback receives the collection and the value, and `unless` returns what the callback returns. If that is `null` or `undefined`, it returns the collection. A third argument is a callback to run when the value is truthy. The value may also be a function, which is called with the collection and whose result is tested. Truthiness is PHP's: see [Truthiness](https://tolki.abe.dev/arrays-objects/php-semantics.html#truthiness). Laravel's one-argument form is not available: see [Not portable](https://tolki.abe.dev/collections/differences.html#not-portable). The inverse is [when](#when).

```js
import { collect } from "@tolki/collection";

const items = collect([1, 2, 3]);

items.unless(true, (collection) => collection.push(4));
items.unless(false, (collection) => collection.push(5));

items.all();
// => [1, 2, 3, 5]

const other = collect([1, 2, 3]);

other.unless(
  true,
  (collection) => collection.push(4),
  (collection) => collection.push(5),
);

other.all();
// => [1, 2, 3, 5]

collect([1, 2, 3])
  .unless(false, (collection) => collection.map((item) => item * 2))
  .all();
// => [2, 4, 6]
```

#### unlessEmpty

Run the callback unless the collection is empty.

Laravel: [`unlessEmpty()`](https://laravel.com/docs/collections#method-unlessempty)

It is an alias of [whenNotEmpty](#whennotempty). The callback receives the collection and `true`. A second callback runs when the collection is empty.

```js
import { collect } from "@tolki/collection";

const names = collect(["Michael", "Tom"]);

names.unlessEmpty((collection) => collection.push("Adam"));

names.all();
// => ["Michael", "Tom", "Adam"]

const empty = collect([]);

empty.unlessEmpty(
  (collection) => collection.push("Adam"),
  (collection) => collection.push("Taylor"),
);

empty.all();
// => ["Taylor"]
```

#### unlessNotEmpty

Run the callback unless the collection is not empty.

Laravel: [`unlessNotEmpty()`](https://laravel.com/docs/collections#method-unlessnotempty)

It is an alias of [whenEmpty](#whenempty). The callback receives the collection and `true`. A second callback runs when the collection is not empty.

```js
import { collect } from "@tolki/collection";

const names = collect(["Michael", "Tom"]);

names.unlessNotEmpty((collection) => collection.push("Adam"));

names.all();
// => ["Michael", "Tom"]

const empty = collect([]);

empty.unlessNotEmpty(
  (collection) => collection.push("Adam"),
  (collection) => collection.push("Taylor"),
);

empty.all();
// => ["Adam"]
```

#### unshift

Add one or more items to the beginning of the collection.

Each item becomes one new item, so an array you pass is added whole. On a keyed collection the new items get the integer keys `0`, `1` and so on, ahead of the existing ones. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#unshift). To add one item under a key, use [prepend](#prepend).

Unlike most other collection methods, `unshift` does not return a new modified collection; it modifies and returns the collection it is called on.

```js
import { collect } from "@tolki/collection";

const items = collect([3, 4]);

items.unshift(1, 2).all();
// => [1, 2, 3, 4]

items.all();
// => [1, 2, 3, 4]

items.unshift(0) === items;
// => true

collect([4, 5, 6]).unshift(["a", "b", "c"]).all();
// => [["a", "b", "c"], 4, 5, 6]

collect({ b: 2 }).unshift({ a: 1 }).all();
// => { 0: { a: 1 }, b: 2 }
```

#### unwrap

The static `unwrap` method gets the items of a collection, and gives any other value back as it is.

Laravel: [`unwrap()`](https://laravel.com/docs/collections#method-unwrap)

It is the reverse of [wrap](#wrap).

```js
import { Collection, collect } from "@tolki/collection";

Collection.unwrap(collect(["John Doe"]));
// => ["John Doe"]

Collection.unwrap(collect({ name: "John Doe" }));
// => { name: "John Doe" }

Collection.unwrap(["John Doe"]);
// => ["John Doe"]

Collection.unwrap("John Doe");
// => "John Doe"
```

#### value

Get one value from the first item that holds the key.

Laravel: [`value()`](https://laravel.com/docs/collections#method-value)

The key may be a path: see [Dot Notation](https://tolki.abe.dev/arrays-objects/dot-notation.html). Items that lack the key are skipped. When no item holds it, you get the default, which may be a function that returns it, or `null` if you pass none. A `null` key always gives `null`.

```js
import { collect } from "@tolki/collection";

const products = collect([
  { product: "Desk", price: 200 },
  { product: "Speaker", price: 400 },
]);

products.value("price");
// => 200

collect([{ name: "Desk" }, { price: 400 }]).value("price");
// => 400

collect([{ details: { price: 200 } }]).value("details.price");
// => 200

products.value("weight", 30);
// => 30

products.value("weight", () => 25);
// => 25

collect([]).value("price");
// => null
```

#### values

Get the items as a list, with the keys reset to consecutive integers.

Laravel: [`values()`](https://laravel.com/docs/collections#method-values)

The items keep their order. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#values).

```js
import { collect } from "@tolki/collection";

collect({
  10: { product: "Desk", price: 200 },
  11: { product: "Speaker", price: 400 },
})
  .values()
  .all();
// => [
//   { product: "Desk", price: 200 },
//   { product: "Speaker", price: 400 },
// ]

collect({ a: 1, b: 2 }).values().all();
// => [1, 2]
```

#### when

Run the callback when the given value is truthy.

Laravel: [`when()`](https://laravel.com/docs/collections#method-when)

The callback receives the collection and the value, and `when` returns what the callback returns. If that is `null` or `undefined`, it returns the collection. A third argument is a callback to run when the value is falsy. The value may also be a function, which is called with the collection and whose result is tested. Truthiness is PHP's: see [Truthiness](https://tolki.abe.dev/arrays-objects/php-semantics.html#truthiness). Laravel's one-argument form is not available: see [Not portable](https://tolki.abe.dev/collections/differences.html#not-portable). The inverse is [unless](#unless).

```js
import { collect } from "@tolki/collection";

const items = collect([1, 2, 3]);

items.when(true, (collection) => collection.push(4));
items.when(false, (collection) => collection.push(5));

items.all();
// => [1, 2, 3, 4]

const other = collect([1, 2, 3]);

other.when(
  false,
  (collection) => collection.push(4),
  (collection) => collection.push(5),
);

other.all();
// => [1, 2, 3, 5]

collect([1, 2, 3])
  .when(true, (collection) => collection.map((item) => item * 2))
  .all();
// => [2, 4, 6]

collect([1, 2, 3])
  .when(
    (collection) => collection.count() > 2,
    (collection, value) => collection.push(value),
  )
  .all();
// => [1, 2, 3, true]
```

#### whenEmpty

Run the callback when the collection is empty.

Laravel: [`whenEmpty()`](https://laravel.com/docs/collections#method-whenempty)

The callback receives the collection and `true`. A second callback runs when the collection is not empty. Like [when](#when), it returns what the callback returns, or the collection if that is `null` or `undefined`. The inverse is [whenNotEmpty](#whennotempty).

```js
import { collect } from "@tolki/collection";

const names = collect(["Michael", "Tom"]);

names.whenEmpty((collection) => collection.push("Adam"));

names.all();
// => ["Michael", "Tom"]

const empty = collect([]);

empty.whenEmpty((collection) => collection.push("Adam"));

empty.all();
// => ["Adam"]

const both = collect(["Michael", "Tom"]);

both.whenEmpty(
  (collection) => collection.push("Adam"),
  (collection) => collection.push("Taylor"),
);

both.all();
// => ["Michael", "Tom", "Taylor"]
```

#### whenNotEmpty

Run the callback when the collection is not empty.

Laravel: [`whenNotEmpty()`](https://laravel.com/docs/collections#method-whennotempty)

The callback receives the collection and `true`. A second callback runs when the collection is empty. Like [when](#when), it returns what the callback returns, or the collection if that is `null` or `undefined`. The inverse is [whenEmpty](#whenempty).

```js
import { collect } from "@tolki/collection";

const names = collect(["Michael", "Tom"]);

names.whenNotEmpty((collection) => collection.push("Adam"));

names.all();
// => ["Michael", "Tom", "Adam"]

const empty = collect([]);

empty.whenNotEmpty((collection) => collection.push("Adam"));

empty.all();
// => []

const both = collect([]);

both.whenNotEmpty(
  (collection) => collection.push("Adam"),
  (collection) => collection.push("Taylor"),
);

both.all();
// => ["Taylor"]
```

#### where

Filter the collection by a key and value.

Laravel: [`where()`](https://laravel.com/docs/collections#method-where)

Pass a key and a value, or a key, an operator and a value. The key may be a path: see [Dot Notation](https://tolki.abe.dev/arrays-objects/dot-notation.html). The operators are `===`, `!==`, `!=`, `==`, `=`, `<>`, `>`, `<`, `>=` and `<=`. With a key alone, it keeps the items where that key is truthy. Values are compared loosely, so `100` matches `"100"`: see [Loose and strict comparison](https://tolki.abe.dev/arrays-objects/php-semantics.html#loose-and-strict-comparison). For strict comparison, use [whereStrict](#wherestrict); for `null`, use [whereNull](#wherenull) and [whereNotNull](#wherenotnull).

<!-- docs/php-parity/Collection/where.json, "C32-D-where-null-key-items" -->

A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

```js
import { collect } from "@tolki/collection";

const products = collect([
  { product: "Desk", price: 200 },
  { product: "Chair", price: 100 },
  { product: "Bookcase", price: 150 },
  { product: "Door", price: 100 },
]);

products.where("price", 100).all();
// => [
//   { product: "Chair", price: 100 },
//   { product: "Door", price: 100 },
// ]

products.where("price", ">", 100).pluck("product").all();
// => ["Desk", "Bookcase"]

collect([{ price: "100" }, { price: 100 }, { price: 99 }])
  .where("price", 100)
  .all();
// => [{ price: "100" }, { price: 100 }]

collect([{ v: 1 }, { v: 0 }, { v: "a" }])
  .where("v")
  .all();
// => [{ v: 1 }, { v: "a" }]
```

#### whereBetween

Filter the collection to the items whose value at a key lies within a range.

Laravel: [`whereBetween()`](https://laravel.com/docs/collections#method-wherebetween)

Pass the key and a list of the lowest and highest values. Both ends are included. The key may be a path: see [Dot Notation](https://tolki.abe.dev/arrays-objects/dot-notation.html). The bounds may also be a collection: see [JavaScript-only additions](https://tolki.abe.dev/collections/differences.html#javascript-only-additions).

<!-- docs/php-parity/Collection/whereBetween.json, "C32-D-whereBetween-null-item" -->

A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

```js
import { collect } from "@tolki/collection";

const products = collect([
  { product: "Desk", price: 200 },
  { product: "Chair", price: 80 },
  { product: "Bookcase", price: 150 },
  { product: "Pencil", price: 30 },
  { product: "Door", price: 100 },
]);

products.whereBetween("price", [100, 200]).pluck("product").all();
// => ["Desk", "Bookcase", "Door"]

products
  .whereBetween("price", collect([30, 80]))
  .pluck("product")
  .all();
// => ["Chair", "Pencil"]
```

#### whereIn

Filter the collection to the items whose value at a key is in the given list.

Laravel: [`whereIn()`](https://laravel.com/docs/collections#method-wherein)

The list may be an array, an object or a collection, and only its values count. Values are compared loosely, so `150` matches `"150"`: see [Loose and strict comparison](https://tolki.abe.dev/arrays-objects/php-semantics.html#loose-and-strict-comparison). For strict comparison, use [whereInStrict](#whereinstrict). The inverse is [whereNotIn](#wherenotin).

<!-- docs/php-parity/Collection/whereIn.json, "C32-D-whereIn-null-key" -->

A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

```js
import { collect } from "@tolki/collection";

const products = collect([
  { product: "Desk", price: 200 },
  { product: "Chair", price: 100 },
  { product: "Bookcase", price: 150 },
  { product: "Door", price: 100 },
]);

products.whereIn("price", [150, 200]).all();
// => [
//   { product: "Desk", price: 200 },
//   { product: "Bookcase", price: 150 },
// ]

collect([{ price: "150" }, { price: 150 }, { price: 2 }])
  .whereIn("price", [150])
  .all();
// => [{ price: "150" }, { price: 150 }]
```

#### whereInstanceOf

Filter the collection to the items that are instances of a class.

Laravel: [`whereInstanceOf()`](https://laravel.com/docs/collections#method-whereinstanceof)

Pass a class, an array of classes or an object whose values are classes. An item is kept when it is an instance of any of them.

<!-- docs/php-parity/Collection/whereInstanceOf.json, "C32-D-whereInstanceOf-assoc-types" -->

A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

```js
import { collect } from "@tolki/collection";

class User {}
class Post {}

const names = (items) => items.all().map((item) => item.constructor.name);

names(collect([new User(), new Post(), new User()]).whereInstanceOf(User));
// => ["User", "User"]

names(collect([new User(), new Post()]).whereInstanceOf([User, Post]));
// => ["User", "Post"]
```

#### whereInStrict

Filter the collection to the items whose value at a key is in the given list, comparing strictly.

Laravel: [`whereInStrict()`](https://laravel.com/docs/collections#method-whereinstrict)

It takes the same arguments as [whereIn](#wherein), but `150` and `"150"` are different values: see [Loose and strict comparison](https://tolki.abe.dev/arrays-objects/php-semantics.html#loose-and-strict-comparison).

<!-- docs/php-parity/Collection/whereInStrict.json, "C32-D-whereInStrict-scalars" -->

A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

```js
import { collect } from "@tolki/collection";

collect([{ price: "150" }, { price: 150 }, { price: 2 }])
  .whereInStrict("price", [150])
  .all();
// => [{ price: 150 }]
```

#### whereNotBetween

Filter the collection to the items whose value at a key lies outside a range.

Laravel: [`whereNotBetween()`](https://laravel.com/docs/collections#method-wherenotbetween)

Pass the key and a list of the lowest and highest values. Values equal to either end are not kept. The inverse is [whereBetween](#wherebetween), and the bounds may be a collection there too: see [JavaScript-only additions](https://tolki.abe.dev/collections/differences.html#javascript-only-additions).

<!-- docs/php-parity/Collection/whereNotBetween.json, "whereNotBetween-list-gap-keys" -->

A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

```js
import { collect } from "@tolki/collection";

const products = collect([
  { product: "Desk", price: 200 },
  { product: "Chair", price: 80 },
  { product: "Bookcase", price: 150 },
  { product: "Pencil", price: 30 },
  { product: "Door", price: 100 },
]);

products.whereNotBetween("price", [100, 200]).pluck("product").all();
// => ["Chair", "Pencil"]
```

#### whereNotIn

Filter the collection to the items whose value at a key is not in the given list.

Laravel: [`whereNotIn()`](https://laravel.com/docs/collections#method-wherenotin)

The list may be an array, an object or a collection, and only its values count. Values are compared loosely, so `150` matches `"150"`: see [Loose and strict comparison](https://tolki.abe.dev/arrays-objects/php-semantics.html#loose-and-strict-comparison). For strict comparison, use [whereNotInStrict](#wherenotinstrict). The inverse is [whereIn](#wherein).

<!-- docs/php-parity/Collection/whereNotIn.json, "C32-D-whereNotIn-null-loose" -->

A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

```js
import { collect } from "@tolki/collection";

const products = collect([
  { product: "Desk", price: 200 },
  { product: "Chair", price: 100 },
  { product: "Bookcase", price: 150 },
  { product: "Door", price: 100 },
]);

products.whereNotIn("price", [150, 200]).all();
// => [
//   { product: "Chair", price: 100 },
//   { product: "Door", price: 100 },
// ]

collect([{ price: "150" }, { price: 150 }, { price: 2 }])
  .whereNotIn("price", [150])
  .all();
// => [{ price: 2 }]
```

#### whereNotInStrict

Filter the collection to the items whose value at a key is not in the given list, comparing strictly.

Laravel: [`whereNotInStrict()`](https://laravel.com/docs/collections#method-wherenotinstrict)

It takes the same arguments as [whereNotIn](#wherenotin), but `150` and `"150"` are different values: see [Loose and strict comparison](https://tolki.abe.dev/arrays-objects/php-semantics.html#loose-and-strict-comparison).

<!-- docs/php-parity/Collection/whereNotInStrict.json, "C32-D-whereNotInStrict-array" -->

A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

```js
import { collect } from "@tolki/collection";

collect([{ price: "150" }, { price: 150 }, { price: 2 }])
  .whereNotInStrict("price", [150])
  .all();
// => [{ price: "150" }, { price: 2 }]
```

#### whereNotNull

Filter the collection to the items whose value at a key is not `null`.

Laravel: [`whereNotNull()`](https://laravel.com/docs/collections#method-wherenotnull)

Falsy values such as `0` and `""` are kept. Leave the key out to test the items themselves. The key may be a path: see [Dot Notation](https://tolki.abe.dev/arrays-objects/dot-notation.html). A key whose value is `undefined` counts as `null`: see [JavaScript-only additions](https://tolki.abe.dev/collections/differences.html#javascript-only-additions). The inverse is [whereNull](#wherenull).

<!-- docs/php-parity/Collection/whereNotNull.json, "C32-D-whereNotNull-dot-path" -->

A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

```js
import { collect } from "@tolki/collection";

const items = collect([
  { name: "Desk" },
  { name: null },
  { name: "Bookcase" },
  { name: 0 },
  { name: "" },
]);

items.whereNotNull("name").all();
// => [{ name: "Desk" }, { name: "Bookcase" }, { name: 0 }, { name: "" }]

collect([1, null, 2]).whereNotNull().all();
// => [1, 2]
```

#### whereNull

Filter the collection to the items whose value at a key is `null`.

Laravel: [`whereNull()`](https://laravel.com/docs/collections#method-wherenull)

Only `null` matches: `0` and `""` do not. Leave the key out to test the items themselves. The key may be a path: see [Dot Notation](https://tolki.abe.dev/arrays-objects/dot-notation.html). A key whose value is `undefined` counts as `null`: see [JavaScript-only additions](https://tolki.abe.dev/collections/differences.html#javascript-only-additions). The inverse is [whereNotNull](#wherenotnull).

<!-- docs/php-parity/Collection/whereNull.json, "whereNull-list-gap-keys" -->

A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

```js
import { collect } from "@tolki/collection";

const items = collect([
  { name: "Desk" },
  { name: null },
  { name: "Bookcase" },
  { name: 0 },
  { name: "" },
]);

items.whereNull("name").all();
// => [{ name: null }]

collect({ a: null, b: 0, c: null }).whereNull().all();
// => { a: null, c: null }
```

#### whereStrict

Filter the collection by a key and value, comparing strictly.

Laravel: [`whereStrict()`](https://laravel.com/docs/collections#method-wherestrict)

It takes a key and a value, as [where](#where) does, but `100` and `"100"` are different values: see [Loose and strict comparison](https://tolki.abe.dev/arrays-objects/php-semantics.html#loose-and-strict-comparison).

<!-- docs/php-parity/Collection/whereStrict.json, "whereStrict-list-gap-keys" -->

A list stays a list, so the items that remain are renumbered from 0. In Laravel they keep the keys they had. See [Keys and order](https://tolki.abe.dev/collections/differences.html#keys-and-order).

```js
import { collect } from "@tolki/collection";

collect([{ price: "100" }, { price: 100 }, { price: 99 }])
  .whereStrict("price", 100)
  .all();
// => [{ price: 100 }]
```

#### wrap

The static `wrap` method puts the given value in a collection.

Laravel: [`wrap()`](https://laravel.com/docs/collections#method-wrap)

An array, a plain object or a `Map` gives a collection of its items. A collection gives a new collection of its items. `null` gives an empty collection. Any other value becomes the only item of a list. The same operation on plain arrays and objects is in the [utilities list](https://tolki.abe.dev/arrays-objects/utilities-list.html#wrap). The reverse is [unwrap](#unwrap).

```js
import { Collection, collect } from "@tolki/collection";

Collection.wrap("John Doe").all();
// => ["John Doe"]

Collection.wrap(["John Doe"]).all();
// => ["John Doe"]

Collection.wrap(collect(["John Doe"])).all();
// => ["John Doe"]

Collection.wrap({ name: "John Doe" }).all();
// => { name: "John Doe" }

Collection.wrap(null).all();
// => []
```

#### zip

Merge the values of the given items with the collection's values, position by position.

Laravel: [`zip()`](https://laravel.com/docs/collections#method-zip)

You get a list with one collection per position, holding that position's value from the collection, then from each of the given items. The given items may be arrays, objects or collections, and only their values count. Pass several to add several values to each position. When one side is shorter, its missing values are `null`. Call `toArray()` to read the inner collections as arrays.

```js
import { collect } from "@tolki/collection";

collect(["Chair", "Desk"]).zip([100, 200]).toArray();
// => [["Chair", 100], ["Desk", 200]]

collect([1, 2, 3]).zip(["a"], [true, false]).toArray();
// => [[1, "a", true], [2, null, false], [3, null, null]]

collect([1, 2]).zip(["a", "b", "c"]).toArray();
// => [[1, "a"], [2, "b"], [null, "c"]]
```

## Differences from Laravel

`@tolki/collection` follows Laravel's `Collection` wherever JavaScript can hold the same data. These are the places where it cannot, or chooses not to.

### Reading items

- `$c['a']` is `c.offsetGet('a')`, `$c->get('a', 0)` is `c.get('a', 0)`, and `$c->all()['a']` is `c.all().a` or `const { a } = c.all()`. There is no `c.a` or `c[0]`, and `$c->a` throws in Laravel too. <!-- docs/php-parity/Collection/__get.json, "__get-unknown-property-throws" -->

```js
import { collect } from "@tolki/collection";

const c = collect({ a: 1 });

c.offsetGet("a");
// => 1

c.get("b", 0);
// => 0

c.all().a;
// => 1
```

### Keys and order

- A list stays a list, since a JavaScript array cannot hold sparse keys: where PHP would leave a gap in a list's integer keys, the collection renumbers them, so `collect([1, 2, 3]).filter((v) => v !== 2).all()` is `[1, 3]`, where PHP keeps the keys `0` and `2`. A keyed write such as `put(5, 'x')` keeps PHP's keys, and the list becomes keyed. <!-- docs/php-parity/Collection/filter.json, "filter-list-gap-keys"; docs/php-parity/Collection/put.json, "C32-B-put-gap-int-key-on-list" -->

  ```js
  import { collect } from "@tolki/collection";

  collect([1, 2, 3])
    .filter((v) => v !== 2)
    .all();
  // => [1, 3]

  collect([1, 2]).put(5, "x").all();
  // => { 0: 1, 1: 2, 5: "x" }
  ```

- `duplicates()` and `chunk()` keep PHP's positional keys, because the keys are the answer, and so do `groupBy(key, true)` and `random(n, true)`, which ask for them. <!-- docs/php-parity/Collection/duplicates.json, "C32-D-duplicates-list-first-key"; docs/php-parity/Collection/chunk.json, "collection-chunk-last-chunk-keys"; docs/php-parity/Collection/groupBy.json, "C32-E-groupBy-preserve-keys-list-backing"; docs/php-parity/Collection/random.json, "C32-C-random-preserved-string-keys" -->
- `chunkBy()` and `chunkWhile()` do not follow `chunk()`: the chunks of a list are lists, so each one counts from 0 again, where PHP's later chunks keep the keys their items had. A keyed collection keeps its string keys in each chunk. <!-- docs/php-parity/Collection/chunkBy.json, "chunkBy with a callback"; docs/php-parity/Collection/chunkWhile.json, "chunkWhile on equal adjacent elements" -->

  ```js
  import { collect } from "@tolki/collection";

  collect([1, 2, 3, 4, 5]).chunk(2).toArray();
  // => [{ 0: 1, 1: 2 }, { 2: 3, 3: 4 }, { 4: 5 }]

  collect([1, 1, 2, 2, 3])
    .chunkBy((value) => value)
    .toArray();
  // => [[1, 1], [2, 2], [3]]

  collect({ a: 1, b: 1, c: 2 })
    .chunkBy((value) => value)
    .toArray();
  // => [{ a: 1, b: 1 }, { c: 2 }]
  ```

- A keyed collection keeps its object backing even when its keys run `0..n-1`: `collect({ 0: 'a', 1: 'b' })`'s `all()` and `toArray()` are `{ 0: 'a', 1: 'b' }`, where PHP's `all()` is the list `['a', 'b']`. `values()` gives the list, and `jsonSerialize()` answers it and `toJson()` writes `["a","b"]`, as PHP's do. <!-- docs/php-parity/Collection/all.json, "all-integer-keys-in-order-is-a-list"; docs/php-parity/Collection/toJson.json, "C32-A-toJson-integer-keys-in-order-are-a-list" -->

  ```js
  import { collect } from "@tolki/collection";

  const keyed = collect({ 0: "a", 1: "b" });

  keyed.all();
  // => { 0: "a", 1: "b" }

  keyed.values().all();
  // => ["a", "b"]

  keyed.toJson();
  // => '["a","b"]'
  ```

- A keyed collection lists its integer keys in ascending order, as a plain object does. Where PHP keeps integer keys out of sequence (`[2 => 'c', 0 => 'a']`), the methods that walk or rebuild such a collection can answer differently from Laravel. In this port, keys built from a `Map`, and items appended after a string key, keep their insertion order wherever the class already tracks it. <!-- docs/php-parity/Collection/set-operations.json, "C32-F-receiver-out-of-order"; docs/php-parity/Collection/keyed-results.json, "C32-E-keyed-results-out-of-order-receiver" -->
- The sort family (`sort()`, `sortDesc()`, `sortBy()`, `sortByDesc()`, `sortKeys()`, `sortKeysDesc()`, `sortKeysUsing()`) and `reverse()` renumber integer keys from 0 in the new order and keep string keys, where PHP keeps every key: `collect([3, 1, 2]).sort()` has the keys `0, 1, 2` and writes `[1,2,3]`, where PHP's has `1, 2, 0` and writes `{"1":1,"2":2,"0":3}`. <!-- docs/php-parity/Collection/sort.json, "sort/sortDesc/reverse preserve integer keys and their order", "C32-G-sort-comparator-assoc"; docs/php-parity/Collection/sortBy.json, "sortBy-keeps-every-key"; docs/php-parity/Collection/sortByDesc.json, "sortByDesc-keeps-every-key"; docs/php-parity/Collection/sortKeys.json, "sortKeys-keeps-every-key"; docs/php-parity/Collection/sortKeysDesc.json, "sortKeysDesc-keeps-every-key"; docs/php-parity/Collection/sortKeysUsing.json, "sortKeysUsing-keeps-every-key"; docs/php-parity/Collection/toJson.json, "C32-A-toJson-integer-keys-out-of-order" -->

  ```js
  import { collect } from "@tolki/collection";

  collect([3, 1, 2]).sort().keys().all();
  // => [0, 1, 2]

  collect([3, 1, 2]).sort().toJson();
  // => '[1,2,3]'
  ```

- On a collection mixing integer and string keys, the sort family and `reverse()` list the integer keys first, as a plain object does, so a new order that puts a string key before an integer one is lost: `collect({ 0: 1, x: 2 }).reverse()` keeps the values `[1, 2]` and `collect({ 0: 3, x: 1 }).sort()` the values `[3, 1]`, where PHP's have the keys `['x', 0]` and the values `[2, 1]` and `[1, 3]`. <!-- docs/php-parity/Collection/reverse.json, "reverse-mixed-int-key-first"; docs/php-parity/Collection/sort.json, "sort-mixed-int-key-first" -->

  ```js
  import { collect } from "@tolki/collection";

  collect({ 0: 1, x: 2 }).reverse().values().all();
  // => [1, 2]

  collect({ 0: 3, x: 1 }).sort().values().all();
  // => [3, 1]
  ```

- PHP remembers the highest integer key a collection has held, so after `forget()` removes that key the next append still counts on from it: `collect([5 => 'a', 6 => 'b'])->forget(6)->push('x')` stores `'x'` under `7`, where this port uses `6`. <!-- docs/php-parity/Collection/forget.json, "C32-B-forget-max-int-key-then-push" -->

### Values

- `all()` hands back the collection's own items, not a copy, so writing to them writes to the collection, where PHP's `all()` returns a copy of its array. `toArray()` and `collect()` return copies. <!-- docs/php-parity/Collection/all.json, "C32-A-all-returns-a-copy" -->
- Truthiness is PHP's, not JavaScript's: see [Truthiness](https://tolki.abe.dev/arrays-objects/php-semantics.html#truthiness). So `reject(false)` rejects `null` and `{}` too but keeps `'0.0'`, a callback answering `NaN` counts as true, and an ArrayAccess-style item whose `offsetExists()` answers `'0'` or `[]` reads as absent. <!-- docs/php-parity/Collection/callback-truthiness.json, "C32-C-collection-callback-php-truthiness"; docs/php-parity/Collection/reject.json, "C32-D-reject-none-php-falsy", "C32-D-reject-none-empty-objects"; docs/php-parity/Php/truthiness.json, "truthiness-NAN"; docs/php-parity/Collection/where.json, "where-arrayaccess-item-offsetexists-answers" -->
- `unique()` and `duplicates()` keep the first of each loosely equal run in one walk (see [Loose and strict comparison](https://tolki.abe.dev/arrays-objects/php-semantics.html#loose-and-strict-comparison)). Where `==` is not transitive across mixed types, PHP's answer can differ: `collect(['abc', '0', false, '']).unique()` keeps `''`, which PHP drops. <!-- docs/php-parity/Collection/unique.json, "C32-D-unique-non-transitive-loose"; docs/php-parity/Collection/duplicates.json, "C32-D-duplicates-non-transitive-loose" -->

  ```js
  import { collect } from "@tolki/collection";

  collect(["abc", "0", false, ""]).unique().all();
  // => ["abc", "0", ""]
  ```

- `diff()`, `diffAssoc()`, `intersect()` and `intersectAssoc()` match an array or object item by identity, where PHP compares string casts: every array casts to `"Array"`, so `collect([[1], [2]]).diff([[1]])` keeps both items where PHP's keeps none, and an object casts through its `__toString()`, or throws without one. <!-- docs/php-parity/Collection/diff.json, "diff-over-array-items-collapses-to-Array", "diff-object-items-cast-through-tostring", "diff-object-items-without-tostring-throw"; docs/php-parity/Collection/intersect.json, "intersect-over-array-items-collapses-to-Array"; docs/php-parity/Collection/diffAssoc.json, "diffAssoc-over-array-items-collapses-to-Array"; docs/php-parity/Collection/intersectAssoc.json, "intersectAssoc-over-array-items-collapses-to-Array" -->

  ```js
  import { collect } from "@tolki/collection";

  collect([[1], [2]])
    .diff([[1]])
    .all();
  // => [[1], [2]]
  ```

- `toJson()` writes `/` and non-ASCII characters as they are, where PHP's `json_encode()` escapes them (`\/`, `\u00e9`); both decode to the same value. <!-- docs/php-parity/Collection/toJson.json, "C32-A-toJson-escapes-slash-and-unicode" -->

  ```js
  import { collect } from "@tolki/collection";

  collect(["a/b", "é"]).toJson();
  // => '["a/b","é"]'
  ```

### JavaScript-only additions

- `length`, `[Symbol.iterator]` (so `for...of` and spreading work), `toJSON()` (so `JSON.stringify(c)` encodes the items) and `[Symbol.toPrimitive]` (the count for `+c`, and the JSON for `` `${c}` ``, as PHP's string cast gives). <!-- docs/php-parity/Collection/__toString.json, "C32-A-string-concat-is-json" -->
- `toJson(replacer, space)` and `toPrettyJson(replacer, space)` take `JSON.stringify()`'s arguments in place of PHP's flags.
- `reduceInto()`'s callback may return the new accumulator, since JavaScript cannot pass a primitive by reference.
- `avg()` and `average()` hand their callback the key as well.
- `whereBetween()` and `whereNotBetween()` accept a collection of bounds, from which PHP reads none, so its `whereBetween()` keeps no item and its `whereNotBetween()` every one. <!-- docs/php-parity/Collection/whereBetween.json, "C32-D-whereBetween-collection-values"; docs/php-parity/Collection/whereNotBetween.json, "C32-D-whereNotBetween-collection-values" -->
- `keyBy()`, `groupBy()` and `countBy()` read an `@tolki/enum` case as its value, as PHP's `enum_value()` does. <!-- docs/php-parity/Collection/keyBy.json, "C32-E-keyBy-enum-keys"; docs/php-parity/Collection/groupBy.json, "C32-E-groupBy-backed-enum-key"; docs/php-parity/Collection/countBy.json, "C32-E-countBy-key-backed-enum" -->
- `eachSpread()` and `mapSpread()` hand the callback a scalar row whole, where PHP throws. <!-- docs/php-parity/Collection/eachSpread.json, "C32-E-eachSpread-scalar-row"; docs/php-parity/Collection/mapSpread.json, "C32-E-mapSpread-scalar-row" -->
- `eachSpread()` and `mapSpread()` spread a string-keyed row (a plain object, a `Map` or a collection) by its values, where PHP throws `Cannot use positional argument after named argument during unpacking`. <!-- docs/php-parity/Collection/eachSpread.json, "C32-E-eachSpread-string-keyed-row", "C32-E-eachSpread-string-keyed-collection-row"; docs/php-parity/Collection/mapSpread.json, "C32-E-mapSpread-string-keyed-row", "C32-E-mapSpread-string-keyed-collection-row" -->
- `ensure()` also takes JavaScript's `typeof` names (`'number'`, `'object'`, …) beside PHP's `get_debug_type()` names and classes.
- A `Map` is accepted wherever PHP takes an array. `undefined` reads as `null` through a path, in the loose comparisons of `contains()`, `search()` and `where()`, and in truthiness (`whereNull('a')` matches `{ a: undefined }`), but an `undefined` item compared strictly, or by the string cast of `diff()` and `intersect()`, is not `null`: keyless `whereNull()` and `containsStrict(null)` skip it, and `diff([null])` keeps it.

### Not portable

- Higher-order proxies (`$c->map->name`, `proxy()`, and the one-argument `when()` and `unless()`), `Macroable` (`macro()`), `lazy()` and `LazyCollection`, `dd()`, `getCachingIterator()`, and PHP's sort flags: every sort takes only a direction.
- `fromJson()` takes `depth` and `flags` for PHP's signature and ignores them. A `WeakMap` cannot be iterated, so it makes an empty collection. An `@tolki/enum` case is a plain object, so `collect()` reads it as a record of its fields, where PHP wraps an enum case as one item. <!-- docs/php-parity/Collection/__construct.json, "construct-enum-case-is-one-item" -->
- Paths read only an object's own fields, so a class getter reads as absent.

### TypeScript limits

- In-place writes cannot narrow the variable they are called on: `c.put('x', 1)` returns the widened type while `c` keeps its declared one, and `c` still names the keys `forget()`, `pull()` or `offsetUnset()` removed.
- There is deliberately no index signature, so `c.a` is a compile error and `c[0]` is untyped (an error under `noImplicitAny`); read items as shown under Reading items.
- A subclass's static factory is typed as the base class: `Sub.make([1])` is a `Collection<number>` to TypeScript, though it returns a `Sub`.
- PHP's `int` and `float` are both `number`, so `ensure('int')` and `ensure('float')` narrow to the same type.
- `new Collection(x)` types only what the class's own type parameters can say, since a constructor cannot declare its own: a `Map<string, V>` stays keyed by `string` (PHP stores a numeric string key as an integer), a record with integer keys gets the list shape (`new Collection({ 1: 'a' })`), a Jsonable is typed by its own members and a JsonSerializable answering a scalar by that scalar's, and a list-or-record union takes its key type's default shape. `collect()` and `make()` type all of these exactly.
- A class operand whose only named members are getters (`class G { get name() { … } }`) is typed as holding `name`, so `merge()`, `union()`, `replace()` and `replaceRecursive()` claim a keyed result, while the runtime copies no own field and keeps a list.
- A class instance's methods are typed as items: `collect(new User())` includes `greet()` in its value and key types, though only own fields are copied, since TypeScript cannot tell a method from a function-valued field.
- A class instance row in `mapSpread()` or `eachSpread()` is typed as spreading its fields, as a plain object row is, though the runtime passes the instance whole.
- Spread rows of varying length (list rows of different lengths, or a row that may be `null`) type every callback parameter as present, each an item or the key; a shorter row's key arrives in an earlier parameter, and the ones after it are `undefined`.
- A union of two collection types cannot call an overloaded method: `(cond ? collect([1]) : collect({ a: 'x' })).filter(cb)` does not compile. Wrap the union instead: `collect(cond ? [1] : { a: 'x' })` merges its members into one collection type.
- `partition()`'s `[0]` and `[1]` survive a method that returns `this`: `c.partition(cb).filter(cb2)[0]` compiles, though the filtered collection has no such member.
- `select()` offers a primitive's or a class item's prototype members as keys (`collect(['ab']).select('length')`) and types a class item's methods as selected, though only own fields are copied.
- On a wide item type (`Collection<unknown>`, or `object`, `{}` or `Function` items), a mis-typed `contains()` or `every()` callback such as `(v: string) => …` compiles; a narrower item type rejects it.
- A misspelt `ensure()` type name compiles, since any string may name a class: `ensure('interger')` narrows the items to `object`, and the runtime throws for the items it rejects.
- `Collection.wrap()` of a class instance, an `Error` or a typed array is typed as keyed by its members, as a plain object is, though the runtime wraps it as one item.
- A plain object with an `all()` member is typed as Collection-like by `flatten()`, `mapSpread()` and `eachSpread()`, and the operand methods (`merge()`, `mergeRecursive()`, `concat()`, `union()`, `replace()`, `replaceRecursive()`, `zip()`, `crossJoin()`, `combine()`, `diffUsing()`, `intersectUsing()`) type none of its function-valued members, while the runtime treats every plain object as data: `collect([1]).merge({ all: () => ['s'] })` is typed as holding numbers alone but keeps the function under the key `'all'`.
- A plain object with a `toArray()` member is typed as an Arrayable by `collect()` and by `toArray()`'s item conversion (`collect([{ toArray: () => [9] }]).toArray()` is typed `number[][]`), though at runtime it is data and comes back unchanged. The operand methods likewise type a plain object with a `toArray()`, `toJson()` or `jsonSerialize()` member as the items that member would hand over: `collect([1]).merge({ toArray: () => ['s'] })` is typed `Collection<string | number, number, "list">`, while the runtime keeps the function under the key `'toArray'`.
- A `symbol` key compiles in `put()` and `prepend()` on a collection typed with `PropertyKey` keys, such as `Collection.fromJson('{}')`, and the runtime stores it under its string form, `'Symbol(s)'`.

<!-- AUTO-GENERATED-DOCS:END -->
